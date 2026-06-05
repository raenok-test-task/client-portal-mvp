import { Test } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([
      {
        id: '1',
        number: 'ORD-1001',
        date: new Date(),
        status: 'PAID',
        amount: 859,
        currency: 'USD',
      },
    ]);
    const moduleRef = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: { order: { findMany } } }],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  it('scopes the query to the user', async () => {
    await service.findForUser('user-1', {});
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    );
  });

  it('adds a case-insensitive search filter', async () => {
    await service.findForUser('user-1', { search: 'ORD-100' });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          number: { contains: 'ORD-100', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('adds a status filter', async () => {
    await service.findForUser('user-1', { status: OrderStatus.PAID });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: OrderStatus.PAID }) }),
    );
  });

  it('converts Decimal amount to a number', async () => {
    const res = await service.findForUser('user-1', {});
    expect(typeof res[0].amount).toBe('number');
  });
});
