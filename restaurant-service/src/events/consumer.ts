import amqp from 'amqplib';
import prisma from '../lib/prisma';
import redis from '../lib/redis';

export async function startConsumer(): Promise<void> {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await conn.createChannel();
    await channel.assertExchange('food-delivery', 'topic', { durable: true });

    // Listen for restaurant.verify from admin-service
    const q = await channel.assertQueue('restaurant.verify.queue', { durable: true });
    await channel.bindQueue(q.queue, 'food-delivery', 'restaurant.verify');

    channel.consume(q.queue, async (msg) => {
      if (!msg) return;
      const { restaurantId } = JSON.parse(msg.content.toString());
      console.log('restaurant.verify received:', restaurantId);

      try {
        await prisma.restaurant.update({
          where: { id: restaurantId },
          data: { isVerified: true, isOpen: true }
        });
        await redis.del('restaurants:all');
        console.log('Restaurant verified:', restaurantId);
      } catch (err) {
        console.error('Failed to verify restaurant:', err);
      }

      channel.ack(msg);
    });

    console.log('Restaurant consumer started');
  } catch (err) {
    console.error('Consumer failed:', err);
  }
}