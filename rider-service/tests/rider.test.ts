import request from 'supertest';
import dotenv from 'dotenv';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import jwt from 'jsonwebtoken';

dotenv.config();

const riderToken = jwt.sign(
  { id: 'test-rider-user-id', role: 'RIDER' },
  process.env.JWT_SECRET!
);

const customerToken = jwt.sign(
  { id: 'test-customer-id', role: 'CUSTOMER' },
  process.env.JWT_SECRET!
);

beforeAll(async () => {
  await prisma.delivery.deleteMany();
  await prisma.rider.deleteMany();
});

afterAll(async () => {
  await prisma.delivery.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.$disconnect();
});

describe('POST /api/riders/profile', () => {
  it('creates a rider profile', async () => {
    const res = await request(app)
      .post('/api/riders/profile')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ name: 'Test Rider', phone: '9876543210' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Rider');
  });

  it('rejects duplicate profile', async () => {
    const res = await request(app)
      .post('/api/riders/profile')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ name: 'Test Rider', phone: '9876543210' });
    expect(res.status).toBe(409);
  });

  it('rejects CUSTOMER role', async () => {
    const res = await request(app)
      .post('/api/riders/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Test Rider', phone: '9876543210' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/riders/location', () => {
  it('updates rider location', async () => {
    const res = await request(app)
      .patch('/api/riders/location')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ latitude: 12.9716, longitude: 77.5946 });
    expect(res.status).toBe(200);
    expect(res.body.latitude).toBe(12.9716);
  });
});

describe('GET /api/riders/available', () => {
  it('returns available riders', async () => {
    const res = await request(app).get('/api/riders/available');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});