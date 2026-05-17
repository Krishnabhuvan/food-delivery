import request from 'supertest';
import dotenv from 'dotenv';
import app from '../src/app';
import prisma from '../src/lib/prisma';

dotenv.config();

beforeAll(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('creates a user and returns token', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Krishna', email: 'k@test.com', password: '123456', role: 'CUSTOMER' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Krishna', email: 'k@test.com', password: '123456', role: 'CUSTOMER' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'k@test.com', password: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'k@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });
});