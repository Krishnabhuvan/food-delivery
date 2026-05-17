import 'dotenv/config';
import app from './app';
import { connectWithRetry } from './events/publisher';

const PORT = process.env.PORT || 4004;

async function start() {
  await connectWithRetry();
  app.listen(PORT, () => console.log(`Admin service on port ${PORT}`));
}

start();