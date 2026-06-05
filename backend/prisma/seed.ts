import { PrismaClient, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Demo login password (not a common/leaked password — avoids browser breach warnings). */
const DEMO_PASSWORD = '4Blanc#Demo26';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: 'client@4blanc.com' },
    update: { passwordHash },
    create: {
      email: 'client@4blanc.com',
      passwordHash,
      name: 'Anna Belova',
      phone: '+1 202 555 0142',
      company: 'Belova Nail Studio',
    },
  });

  await prisma.order.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // 21 demo orders (3× the original set) for realistic list/filter UX.
  const catalog: { status: OrderStatus; amount: string }[] = [
    { status: OrderStatus.PAID, amount: '859.00' },
    { status: OrderStatus.SHIPPED, amount: '499.00' },
    { status: OrderStatus.DELIVERED, amount: '32.99' },
    { status: OrderStatus.DELIVERED, amount: '149.00' },
    { status: OrderStatus.CANCELLED, amount: '99.99' },
    { status: OrderStatus.PENDING, amount: '34.99' },
    { status: OrderStatus.DELIVERED, amount: '859.00' },
  ];

  const orders = Array.from({ length: 21 }, (_, i) => {
    const item = catalog[i % catalog.length];
    return {
      number: `ORD-${1001 + i}`,
      date: daysAgo(2 + i * 4),
      status: item.status,
      amount: item.amount,
    };
  });

  for (const o of orders) {
    await prisma.order.create({ data: { ...o, userId: user.id } });
  }

  await prisma.supportTicket.deleteMany({ where: { userId: user.id } });
  await prisma.supportTicket.create({
    data: {
      userId: user.id,
      subject: 'Filter replacement question',
      message: 'How often should I replace the HEPA-12 filter on the Maestro station?',
      status: 'CLOSED',
    },
  });

  console.log(`Seeded user ${user.email} with ${orders.length} orders.`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
