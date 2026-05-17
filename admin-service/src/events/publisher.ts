import amqp from 'amqplib';

let channel: amqp.Channel;

export async function connectRabbitMQ(): Promise<void> {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await conn.createChannel();
    await channel.assertExchange('food-delivery', 'topic', { durable: true });
    console.log('RabbitMQ connected (admin-service)');
    conn.on('error', (err) => console.error('RabbitMQ error:', err.message));
  } catch (err) {
    console.error('RabbitMQ connection failed:', err);
    throw err;
  }
}

export async function publish(routingKey: string, data: object): Promise<void> {
  try {
    if (!channel) {
      console.error('RabbitMQ channel not ready');
      return;
    }
    channel.publish('food-delivery', routingKey, Buffer.from(JSON.stringify(data)));
  } catch (err) {
    console.error('Publish failed:', err);
  }
}

export async function connectWithRetry(retries = 5, delay = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await connectRabbitMQ();
      return;
    } catch (err) {
      console.error(`RabbitMQ attempt ${i + 1} failed. Retrying...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('RabbitMQ failed after all retries');
}