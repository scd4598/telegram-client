import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import cabinetRouter from './routes/cabinets';
import telegramAccountsRouter from './routes/telegramAccounts';
import chatRouter from './routes/chats';
import { authMiddleware } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { createTelegramManager } from './telegram/telegramManager';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const telegramManager = createTelegramManager(prisma, io);

authMiddleware.configure(prisma);

app.use(cors());
app.use(express.json());
app.set('io', io);
app.set('telegramManager', telegramManager);

app.use('/api/auth', authRouter(prisma));
app.use('/api/cabinets', cabinetRouter(prisma));
app.use('/api/telegram/accounts', telegramAccountsRouter(prisma, telegramManager));
app.use('/api/chats', chatRouter(prisma, telegramManager));

app.use(errorHandler);

const port = process.env.PORT || 4000;
server.listen(port, async () => {
  await telegramManager.bootstrapActiveAccounts();
  console.log(`Server started on port ${port}`);
});
