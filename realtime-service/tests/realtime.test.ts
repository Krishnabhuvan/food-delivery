import request from 'supertest';
import { io } from 'socket.io-client';
import { AddressInfo } from 'net';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from '../src/app';

describe('Realtime service', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('accepts socket connections and join-room events', (done) => {
    const httpServer = createServer(app);
    const ioServer = new SocketIOServer(httpServer, {
      cors: { origin: '*' }
    });

    ioServer.on('connection', (socket) => {
      socket.on('join-room', (room: string) => {
        socket.emit('joined-room', room);
      });
    });

    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      const client = io(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true
      });

      client.on('connect', () => {
        client.emit('join-room', 'test-room');
      });

      client.on('joined-room', (room) => {
        expect(room).toBe('test-room');
        client.close();
        ioServer.close();
        httpServer.close();
        done();
      });
    });
  });
});
