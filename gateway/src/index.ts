import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import compression from 'compression';

const app = express();
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
    { name: 'auth', url: 'http://localhost:4001/health' },
    { name: 'restaurant', url: 'http://localhost:4002/health' },
    { name: 'rider', url: 'http://localhost:4003/health' },
    { name: 'admin', url: 'http://localhost:4004/health' },
    { name: 'realtime', url: 'http://localhost:4005/health' },
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

app.use('/api/auth', createProxyMiddleware({ target: 'http://localhost:4001', changeOrigin: true }));
app.use('/api/restaurants', createProxyMiddleware({ target: 'http://localhost:4002', changeOrigin: true }));
app.use('/api/menu', createProxyMiddleware({ target: 'http://localhost:4002', changeOrigin: true }));
app.use('/api/orders', createProxyMiddleware({ target: 'http://localhost:4002', changeOrigin: true }));
app.use('/api/riders', createProxyMiddleware({ target: 'http://localhost:4003', changeOrigin: true }));
app.use('/api/admin', createProxyMiddleware({ target: 'http://localhost:4004', changeOrigin: true }));
app.use('/api/upload', createProxyMiddleware({ target: 'http://localhost:4006', changeOrigin: true }));
app.use('/api/payment', createProxyMiddleware({ target: 'http://localhost:4006', changeOrigin: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));