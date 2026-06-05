import { Test } from '@nestjs/testing';
import { AssistantService } from './assistant.service';
import { OrdersService } from '../orders/orders.service';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

const mockOrders = [
  { number: 'ORD-1001', date: daysAgo(3), status: 'PAID', amount: 859, currency: 'USD' },
  { number: 'ORD-1002', date: daysAgo(12), status: 'SHIPPED', amount: 499, currency: 'USD' },
  { number: 'ORD-1003', date: daysAgo(40), status: 'DELIVERED', amount: 100, currency: 'USD' },
  { number: 'ORD-1004', date: daysAgo(50), status: 'CANCELLED', amount: 99, currency: 'USD' },
];

describe('AssistantService (rule-based)', () => {
  let service: AssistantService;

  beforeEach(async () => {
    process.env.AI_PROVIDER = 'mock';
    const moduleRef = await Test.createTestingModule({
      providers: [
        AssistantService,
        {
          provide: OrdersService,
          useValue: { findForUser: jest.fn().mockResolvedValue(mockOrders) },
        },
      ],
    }).compile();
    service = moduleRef.get(AssistantService);
  });

  it('lists recent orders', async () => {
    const res = await service.chat('u1', 'Show my last orders');
    expect(res.source).toBe('mock');
    expect(res.reply).toContain('ORD-1001');
  });

  it('counts orders in the last month', async () => {
    const res = await service.chat('u1', 'How many orders in the last month?');
    expect(res.reply).toContain('2 order'); // ORD-1001 and ORD-1002 within 30 days
  });

  it('computes total spent excluding cancelled', async () => {
    const res = await service.chat('u1', 'What did I spend in total?');
    // 859 + 499 + 100 = 1458 (CANCELLED 99 excluded)
    expect(res.reply).toContain('1458.00');
  });

  it('answers about a specific order', async () => {
    const res = await service.chat('u1', 'status of ORD-1002');
    expect(res.reply).toContain('ORD-1002');
    expect(res.reply).toContain('SHIPPED');
  });

  it('falls back to help text for unknown questions', async () => {
    const res = await service.chat('u1', 'what is the weather');
    expect(res.reply.toLowerCase()).toContain('i can help');
  });
});
