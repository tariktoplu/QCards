import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { initializeSocketEvents } from './socket';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.CLIENT_URL || ""].filter(Boolean),
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Initialize all our socket event listeners
initializeSocketEvents(io);

app.get('/', (req: Request, res: Response) => {
  res.send('Quantum Bluff - Game Server is running!');
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});