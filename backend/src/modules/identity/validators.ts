import { z } from 'zod';
import { ActiveMode } from '@aptifyx/shared-types';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const switchModeSchema = z.object({
  mode: z.nativeEnum(ActiveMode),
});

export const partnerSetupSchema = z.object({
  skills: z.array(z.string()).min(1),
  bio: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
});
