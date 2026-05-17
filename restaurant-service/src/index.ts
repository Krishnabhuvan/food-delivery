import 'dotenv/config';
import app from './app';
import { connectWithRetry } from './events/publisher';
import { connectRedis } from './lib/redis';
import { startConsumer } from './events/consumer';

const PORT = process.env.PORT || 4002;

async function start() {
  await connectRedis();
  await connectWithRetry();
  await startConsumer();
  app.listen(PORT, () => console.log(`Restaurant service on port ${PORT}`));
}

start();