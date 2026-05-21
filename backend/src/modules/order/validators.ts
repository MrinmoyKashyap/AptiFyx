import { z } from 'zod';

export const createJobSchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string().min(10),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  offeredAmount: z.number().positive(),
});

export const rateJobSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
});
