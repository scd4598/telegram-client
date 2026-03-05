import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createCabinetSchema = z.object({
  name: z.string().min(1).max(255),
});

export const assignUserSchema = z.object({
  userId: z.number().int().positive(),
});

export const createAccountSchema = z.object({
  phone: z.string().min(7).max(20),
  cabinetId: z.number().int().positive(),
  displayName: z.string().max(255).optional(),
});

export const confirmCodeSchema = z.object({
  code: z.string().min(1),
});

export const sendMessageSchema = z.object({
  accountId: z.number().int().positive(),
  text: z.string().min(1),
});

export const accountIdQuery = z.object({
  accountId: z.string().regex(/^\d+$/, 'accountId must be a number'),
});

export const idParam = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a number'),
});
