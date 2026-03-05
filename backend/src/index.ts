import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { config } from './config';
import authRouter from './routes/auth';
import cabinetRouter from './routes/cabinets';
import telegramAccountsRouter from './routes/telegramAccounts';
import chatRouter from './routes/chats';
import { authMiddleware } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { createTelegramManager } from './telegram/telegramManager';

// Validate required env vars at startup
config.jwtSecret;
config.databaseUrl;

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
  },
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: number; role: Role };
    socket.data.userId = payload.userId;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Join user to cabinet-scoped rooms on connect
io.on('connection', async (socket) => {
  const userId = socket.data.userId as number;
  const role = socket.data.role as Role;
  try {
    let cabinetIds: number[];
    if (role === Role.admin) {
      const cabinets = await prisma.cabinet.findMany({ select: { id: true } });
      cabinetIds = cabinets.map((c) => c.id);
    } else {
      const userCabinets = await prisma.userCabinet.findMany({
        where: { userId },
        select: { cabinetId: true },
      });
      cabinetIds = userCabinets.map((uc) => uc.cabinetId);
    }
    for (const id of cabinetIds) {
      socket.join(`cabinet:${id}`);
    }
  } catch (err) {
    console.error('Failed to setup socket rooms', err);
  }
});

const telegramManager = createTelegramManager(prisma, io);

authMiddleware.configure(prisma);

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.set('io', io);
app.set('telegramManager', telegramManager);

app.use('/api/auth', authRouter(prisma));
app.use('/api/cabinets', cabinetRouter(prisma));
app.use('/api/telegram/accounts', telegramAccountsRouter(prisma, telegramManager));
app.use('/api/chats', chatRouter(prisma, telegramManager));

app.use(errorHandler);

const port = config.port;
server.listen(port, async () => {
  await telegramManager.bootstrapActiveAccounts();
  console.log(`Server started on port ${port}`);
});
