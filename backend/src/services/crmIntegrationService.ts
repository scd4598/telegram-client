import { PrismaClient, Message, MessageDirection } from '@prisma/client';

export function createCrmIntegrationService(prisma: PrismaClient) {
  async function onIncomingMessage(message: Message) {
    await prisma.crmEvent.create({ data: { direction: MessageDirection.in, payload: message as any } });
    console.log('[CRM] incoming message placeholder', message.id);
  }

  async function onOutgoingMessage(message: Message) {
    await prisma.crmEvent.create({ data: { direction: MessageDirection.out, payload: message as any } });
    console.log('[CRM] outgoing message placeholder', message.id);
  }

  return { onIncomingMessage, onOutgoingMessage };
}
