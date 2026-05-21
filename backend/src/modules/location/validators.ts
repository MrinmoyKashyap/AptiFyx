import { z } from 'zod';

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const getNearbySchema = z.object({
  latitude: z.string().transform((val) => parseFloat(val)),
  longitude: z.string().transform((val) => parseFloat(val)),
  radiusKm: z.string().transform((val) => parseFloat(val)).optional().default('5'),
  categoryId: z.string().optional(), // Optional skill filter
});

export const broadcastSchema = z.object({
  jobId: z.string().uuid(),
  categoryId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});
