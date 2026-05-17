import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

export default app;