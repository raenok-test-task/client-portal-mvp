import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

interface OrderSummary {
  number: string;
  date: Date;
  status: string;
  amount: number;
  currency: string;
}

interface AccountSnapshot {
  totalOrders: number;
  ordersLast30Days: number;
  totalSpent: number;
  currency: string;
  recentOrders: OrderSummary[];
  allOrders: OrderSummary[];
}

export interface ChatResult {
  reply: string;
  source: 'mock' | 'openai';
  data?: unknown;
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(private readonly orders: OrdersService) {}

  async chat(userId: string, message: string): Promise<ChatResult> {
    const snapshot = await this.buildSnapshot(userId);
    const provider = (process.env.AI_PROVIDER ?? 'mock').toLowerCase();

    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      try {
        const reply = await this.callOpenAI(message, snapshot);
        return { reply, source: 'openai' };
      } catch (err) {
        // Never fail the request because the LLM is unavailable: fall back gracefully.
        this.logger.warn(`OpenAI call failed, falling back to rule-based: ${String(err)}`);
      }
    }

    const { reply, data } = this.answerFromRules(message, snapshot);
    return { reply, source: 'mock', data };
  }

  private async buildSnapshot(userId: string): Promise<AccountSnapshot> {
    const orders = (await this.orders.findForUser(userId, {})) as unknown as OrderSummary[];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const ordersLast30Days = orders.filter((o) => new Date(o.date) >= thirtyDaysAgo).length;
    const totalSpent = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.amount, 0);

    return {
      totalOrders: orders.length,
      ordersLast30Days,
      totalSpent: Math.round(totalSpent * 100) / 100,
      currency: orders[0]?.currency ?? 'USD',
      recentOrders: orders.slice(0, 5),
      allOrders: orders,
    };
  }

  /**
   * Deterministic, rule-based intent handling. Works without any API key and is
   * fully testable. Supports English and Russian phrasings from the brief.
   */
  private answerFromRules(
    message: string,
    snapshot: AccountSnapshot,
  ): { reply: string; data?: unknown } {
    const text = message.toLowerCase();
    const fmt = (n: number) => `${n.toFixed(2)} ${snapshot.currency}`;

    // Status of a specific order, e.g. "ORD-1002"
    const orderMatch = message.match(/ord[-\s]?(\d{3,})/i);
    if (orderMatch) {
      const number = `ORD-${orderMatch[1]}`;
      const found = snapshot.allOrders.find((o) => o.number.toUpperCase() === number);
      if (found) {
        return {
          reply: `Order ${found.number} from ${this.formatDate(found.date)} is ${found.status} for ${fmt(found.amount)}.`,
          data: found,
        };
      }
      return { reply: `I couldn't find an order ${number} on your account.` };
    }

    const has = (...words: string[]) => words.some((w) => text.includes(w));

    // Count over the last month
    if (has('last month', 'last 30', 'за последний месяц', 'за месяц', 'how many')) {
      return {
        reply: `You placed ${snapshot.ordersLast30Days} order(s) in the last 30 days (out of ${snapshot.totalOrders} total).`,
        data: { ordersLast30Days: snapshot.ordersLast30Days, totalOrders: snapshot.totalOrders },
      };
    }

    // Total spent
    if (has('total', 'spent', 'sum', 'сумм', 'потрат', 'итого')) {
      return {
        reply: `You have spent ${fmt(snapshot.totalSpent)} across ${snapshot.totalOrders} order(s) (cancelled orders excluded).`,
        data: { totalSpent: snapshot.totalSpent, currency: snapshot.currency },
      };
    }

    // Last / recent orders
    if (has('last order', 'recent', 'latest', 'show my order', 'my orders', 'последн', 'заказ')) {
      if (snapshot.recentOrders.length === 0) {
        return { reply: 'You have no orders yet.' };
      }
      const lines = snapshot.recentOrders
        .map((o) => `• ${o.number} — ${this.formatDate(o.date)} — ${o.status} — ${fmt(o.amount)}`)
        .join('\n');
      return {
        reply: `Here are your ${snapshot.recentOrders.length} most recent orders:\n${lines}`,
        data: snapshot.recentOrders,
      };
    }

    return {
      reply:
        'I can help with your account. Try: "Show my last orders", ' +
        '"How many orders in the last month?", "What did I spend in total?", ' +
        'or ask about a specific order like "ORD-1002".',
    };
  }

  private async callOpenAI(message: string, snapshot: AccountSnapshot): Promise<string> {
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const systemPrompt =
      'You are the 4Blanc client portal assistant. Answer ONLY using the JSON account ' +
      'data provided. Be concise. If the data does not contain the answer, say so. ' +
      'Never invent orders or amounts.';

    const context = JSON.stringify({
      totalOrders: snapshot.totalOrders,
      ordersLast30Days: snapshot.ordersLast30Days,
      totalSpent: snapshot.totalSpent,
      currency: snapshot.currency,
      orders: snapshot.allOrders.map((o) => ({
        number: o.number,
        date: this.formatDate(o.date),
        status: o.status,
        amount: o.amount,
      })),
    });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: `Account data: ${context}` },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI returned ${res.status}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('Empty completion');
    }
    return reply;
  }

  private formatDate(date: Date | string): string {
    return new Date(date).toISOString().slice(0, 10);
  }
}
