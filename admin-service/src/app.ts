import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/admin.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

export default app;