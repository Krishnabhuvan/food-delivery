import request from 'supertest';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/lib/prisma';

dotenv.config();

const adminToken = jwt.sign(
  { id: 'admin-test-id', role: 'ADMIN' },
  process.env.JWT_SECRET!,
  { expiresIn: '1h' }
);

beforeAll(async () => {
  await prisma.adminLog.deleteMany();
});

afterAll(async () => {
  await prisma.adminLog.deleteMany();
  await prisma.$disconnect();
});

describe('Admin service', () => {
  it('creates a restaurant verification log', async () => {
    const res = await request(app)
      .post('/api/admin/verify-restaurant')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ restaurantId: 'restaurant-test-id' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Restaurant verified', restaurantId: 'restaurant-test-id' });
  });

  it('creates a user suspension log', async () => {
    const res = await request(app)
      .post('/api/admin/suspend-user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: 'user-test-id', reason: 'test reason' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'User suspended', userId: 'user-test-id', reason: 'test reason' });
  });

  it('returns admin logs', async () => {
    const res = await request(app)
      .get('/api/admin/logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});
