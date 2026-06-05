import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryOrdersDto } from './dto/query-orders.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: string, query: QueryOrdersDto) {
    const where: Prisma.OrderWhereInput = { userId };

    if (query.search) {
      where.number = { contains: query.search, mode: 'insensitive' };
    }
    if (query.status) {
      where.status = query.status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        number: true,
        date: true,
        status: true,
        amount: true,
        currency: true,
      },
    });

    // Decimal -> number for clean JSON; amounts here are well within safe range.
    return orders.map((o) => ({ ...o, amount: Number(o.amount) }));
  }
}
