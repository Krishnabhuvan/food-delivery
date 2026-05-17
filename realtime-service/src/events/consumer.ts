import amqp from 'amqplib';
import { Server } from 'socket.io';

let io: Server;

export function setIO(socketServer: Server) {
  io = socketServer;
}

export async function connectRabbitMQ(): Promise<void> {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await conn.createChannel();
    await channel.assertExchange('food-delivery', 'topic', { durable: true });
    console.log('RabbitMQ connected (realtime-service)');

    const statusQueue = await channel.assertQueue('realtime.order.status', { durable: true });
    await channel.bindQueue(statusQueue.queue, 'food-delivery', 'order.status.changed');
    channel.consume(statusQueue.queue, (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      console.log('order.status.changed received:', data);

      io.to(`user:${data.customerId}`).emit('order-status-updated', {
        orderId: data.orderId,
        status: data.status
      });

      if (data.restaurantOwnerId) {
        io.to(`user:${data.restaurantOwnerId}`).emit('order-status-updated', {
          orderId: data.orderId,
          status: data.status
        });
      }

      channel.ack(msg);
    });

    const orderQueue = await channel.assertQueue('realtime.order.placed', { durable: true });
    await channel.bindQueue(orderQueue.queue, 'food-delivery', 'order.placed');
    channel.consume(orderQueue.queue, (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      console.log('order.placed received:', data);
      io.to(`user:${data.restaurantOwnerId}`).emit('new-order', {
        orderId: data.orderId,
        totalAmount: data.totalAmount,
        address: data.address,
        items: data.items
      });
      channel.ack(msg);
    });

    const riderQueue = await channel.assertQueue('realtime.rider.assigned', { durable: true });
    await channel.bindQueue(riderQueue.queue, 'food-delivery', 'rider.assigned');
    channel.consume(riderQueue.queue, (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      console.log('rider.assigned received:', data);
      io.to(`user:${data.customerId}`).emit('rider-assigned', {
        orderId: data.orderId,
        riderId: data.riderId
      });
      channel.ack(msg);
    });

    conn.on('error', (err) => {
      console.error('RabbitMQ error:', err.message);
    });

  } catch (err) {
    console.error('RabbitMQ connection failed:', err);
    throw err;
  }
}

export async function connectWithRetry(retries = 5, delay = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await connectRabbitMQ();
      return;
    } catch (err) {
      console.error(`RabbitMQ connect attempt ${i + 1} failed. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('RabbitMQ failed after all retries');
}