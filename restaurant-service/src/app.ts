import express from 'express';
import cors from 'cors';
import restaurantRoutes from './routes/restaurant.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

export default app;