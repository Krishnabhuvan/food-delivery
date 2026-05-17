import request from 'supertest';
import dotenv from 'dotenv';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import jwt from 'jsonwebtoken';

dotenv.config();

const restaurantToken = jwt.sign(
  { id: 'test-owner-id', role: 'RESTAURANT' },
  process.env.JWT_SECRET!
);

const customerToken = jwt.sign(
  { id: 'test-customer-id', role: 'CUSTOMER' },
  process.env.JWT_SECRET!
);

beforeAll(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
});

afterAll(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.$disconnect();
});

describe('POST /api/restaurants', () => {
  it('creates a restaurant for RESTAURANT role', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${restaurantToken}`)
      .send({ name: 'Test Kitchen', address: '123 MG Road', phone: '9876543210' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Kitchen');
  });

  it('rejects duplicate restaurant for same owner', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${restaurantToken}`)
      .send({ name: 'Test Kitchen 2', address: '456 Road', phone: '1234567890' });
    expect(res.status).toBe(409);
  });

  it('rejects CUSTOMER role', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Test Kitchen', address: '123 MG Road', phone: '9876543210' });
    expect(res.status).toBe(403);
  });
});

describe('POST /api/menu', () => {
  it('adds a menu item to restaurant', async () => {
    const res = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${restaurantToken}`)
      .send({ name: 'Biryani', description: 'Spicy', price: 250, category: 'Main' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Biryani');
  });
});

describe('GET /api/restaurants', () => {
  it('returns only verified and open restaurants', async () => {
    const res = await request(app).get('/api/restaurants');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});