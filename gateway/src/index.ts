import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import compression from 'compression';

const app = express();

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const RESTAURANT_SERVICE = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:4002';
const RIDER_SERVICE = process.env.RIDER_SERVICE_URL || 'http://localhost:4003';
const ADMIN_SERVICE = process.env.ADMIN_SERVICE_URL || 'http://localhost:4004';
const REALTIME_SERVICE = process.env.REALTIME_SERVICE_URL || 'http://localhost:4005';
const UTILS_SERVICE = process.env.UTILS_SERVICE_URL || 'http://localhost:4006';

app.use(helmet());
app.use(compression());
app.use(cors());

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, try again later' }
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use(generalLimiter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.get('/health/services', async (_, res) => {
  const services = [
    { name: 'auth', url: `${AUTH_SERVICE}/health` },
    { name: 'restaurant', url: `${RESTAURANT_SERVICE}/health` },
    { name: 'rider', url: `${RIDER_SERVICE}/health` },
    { name: 'admin', url: `${ADMIN_SERVICE}/health` },
    { name: 'realtime', url: `${REALTIME_SERVICE}/health` },
  ];

  const results = await Promise.allSettled(
    services.map(async s => {
      const start = Date.now();
      await fetch(s.url);
      return { name: s.name, status: 'up', latency: `${Date.now() - start}ms` };
    })
  );

  const statuses = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { name: services[i].name, status: 'down', latency: null }
  );

  res.json({ services: statuses, timestamp: new Date().toISOString() });
});

app.use('/api/auth', createProxyMiddleware({ target: AUTH_SERVICE, changeOrigin: true }));
app.use('/api/restaurants', createProxyMiddleware({ target: RESTAURANT_SERVICE, changeOrigin: true }));
app.use('/api/menu', createProxyMiddleware({ target: RESTAURANT_SERVICE, changeOrigin: true }));
app.use('/api/orders', createProxyMiddleware({ target: RESTAURANT_SERVICE, changeOrigin: true }));
app.use('/api/riders', createProxyMiddleware({ target: RIDER_SERVICE, changeOrigin: true }));
app.use('/api/admin', createProxyMiddleware({ target: ADMIN_SERVICE, changeOrigin: true }));
app.use('/api/upload', createProxyMiddleware({ target: UTILS_SERVICE, changeOrigin: true }));
app.use('/api/payment', createProxyMiddleware({ target: UTILS_SERVICE, changeOrigin: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));