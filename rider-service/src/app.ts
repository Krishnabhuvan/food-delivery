import express from 'express';
import cors from 'cors';
import riderRoutes from './routes/rider.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/riders', riderRoutes);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

export default app;