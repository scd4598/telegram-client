-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'manager');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'paused', 'risk', 'error');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('not_contacted', 'first_sent', 'responded');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('in', 'out');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cabinet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cabinet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCabinet" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cabinetId" INTEGER NOT NULL,

    CONSTRAINT "UserCabinet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramAccount" (
    "id" SERIAL NOT NULL,
    "cabinetId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "telegramUserId" TEXT,
    "sessionData" TEXT,
    "displayName" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "noFirstMessagesUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" SERIAL NOT NULL,
    "telegramAccountId" INTEGER NOT NULL,
    "chatId" TEXT NOT NULL,
    "title" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "lastMessageText" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "chatStatus" "ChatStatus" NOT NULL DEFAULT 'not_contacted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "telegramAccountId" INTEGER NOT NULL,
    "chatId" INTEGER NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "telegramMessageId" TEXT,
    "fromName" TEXT,
    "text" TEXT,
    "rawPayload" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDailyLimit" (
    "id" SERIAL NOT NULL,
    "telegramAccountId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "firstMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "maxFirstPerDay" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountDailyLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmEvent" (
    "id" SERIAL NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserCabinet_userId_cabinetId_key" ON "UserCabinet"("userId", "cabinetId");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_telegramAccountId_chatId_key" ON "Chat"("telegramAccountId", "chatId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountDailyLimit_telegramAccountId_date_key" ON "AccountDailyLimit"("telegramAccountId", "date");

-- AddForeignKey
ALTER TABLE "UserCabinet" ADD CONSTRAINT "UserCabinet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCabinet" ADD CONSTRAINT "UserCabinet_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramAccount" ADD CONSTRAINT "TelegramAccount_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDailyLimit" ADD CONSTRAINT "AccountDailyLimit_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
