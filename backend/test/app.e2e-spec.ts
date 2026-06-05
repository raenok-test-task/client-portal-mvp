import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * End-to-end smoke test of the main client journey.
 * Requires a reachable PostgreSQL database (DATABASE_URL) seeded with the demo user.
 * In CI this runs against the Postgres service container.
 */
describe('Client portal (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects invalid login (400 on bad payload)', () => {
    return request(app.getHttpServer())
      .post('/api/login')
      .send({ email: 'not-an-email', password: '123' })
      .expect(400);
  });

  it('logs in the demo user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/login')
      .send({ email: 'client@4blanc.com', password: '4Blanc#Demo26' })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    token = res.body.accessToken;
  });

  it('blocks profile access without a token', () => {
    return request(app.getHttpServer()).get('/api/profile').expect(401);
  });

  it('returns the profile with a token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.email).toBe('client@4blanc.com');
  });

  it('returns orders and supports status filtering', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/orders?status=DELIVERED')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((o: { status: string }) => expect(o.status).toBe('DELIVERED'));
  });

  it('creates a support ticket', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/support-ticket')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'E2E test ticket', message: 'This is an automated e2e test message.' })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('OPEN');
  });

  it('answers an assistant question from real data', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Show my last orders' })
      .expect(201);
    expect(res.body.reply).toContain('ORD-');
  });
});
