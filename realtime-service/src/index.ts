import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { connectWithRetry, setIO } from './events/consumer';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Pass io to consumer so it can emit to socket rooms
setIO(io);

// JWT auth middleware for Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token provided'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`Connected: ${user.id} (${user.role})`);

  socket.join(`user:${user.id}`);
  socket.join(`role:${user.role}`);

  socket.on('join-order', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`${user.id} joined order room: ${orderId}`);
  });

  socket.on('rider:location', (data: { latitude: number; longitude: number }) => {
    io.to(`tracking:${user.id}`).emit('rider:location:update', {
      riderId: user.id,
      ...data,
      timestamp: new Date()
    });
  });

  socket.on('track:rider', (data: { riderId: string }) => {
    socket.join(`tracking:${data.riderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${user.id}`);
  });
});

const PORT = process.env.PORT || 4005;

async function start() {
  await connectWithRetry();
  httpServer.listen(PORT, () => console.log(`Realtime service on port ${PORT}`));
}

start();

export { io };
export default app;