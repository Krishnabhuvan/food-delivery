import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import prisma from './lib/prisma';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.get('/test-db', async (_, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ 
      status: 'connected', 
      userCount: count,
      dbUrl: process.env.DATABASE_URL?.split('@')[1] // shows host only, no password
    });
  } catch (err: any) {
    res.json({ 
      status: 'error', 
      message: err.message,
      dbUrl: process.env.DATABASE_URL?.split('@')[1]
    });
  }
});

export default app;