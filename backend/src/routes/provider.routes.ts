import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Toggle online/offline
router.post('/toggle-status', authenticate, requireRole('provider'), async (req: Request, res: Response) => {
  const provider = await prisma.provider.update({
    where: { id: req.user!.id },
    data: { isOnline: req.body.isOnline },
  });
  res.json({ success: true, isOnline: provider.isOnline });
});

// Update location
router.post('/location', authenticate, requireRole('provider'), async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;
  if (latitude == null || longitude == null) {
    return res.status(400).json({ error: 'latitude and longitude required' });
  }
  await prisma.provider.update({
    where: { id: req.user!.id },
    data: { latitude, longitude },
  });
  res.json({ success: true });
});

// Get provider profile
router.get('/me', authenticate, requireRole('provider'), async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { id: req.user!.id } });
  if (!provider) return res.status(404).json({ error: 'Provider not found' });
  res.json({
    ...provider,
    services: JSON.parse(provider.services || '[]'),
  });
});

// Update services
router.put('/services', authenticate, requireRole('provider'), async (req: Request, res: Response) => {
  const { services } = req.body;
  if (!Array.isArray(services)) return res.status(400).json({ error: 'services must be an array' });
  const provider = await prisma.provider.update({
    where: { id: req.user!.id },
    data: { services: JSON.stringify(services) },
  });
  res.json({ success: true, services: JSON.parse(provider.services) });
});

// Get provider job history
router.get('/jobs', authenticate, requireRole('provider'), async (req: Request, res: Response) => {
  const jobs = await prisma.job.findMany({
    where: { providerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: true },
  });
  res.json(jobs);
});

// Get earnings summary
router.get('/earnings', authenticate, requireRole('provider'), async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { id: req.user!.id } });
  const commissions = await prisma.commission.findMany({
    where: { providerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({
    totalJobsDone: provider?.totalJobsDone ?? 0,
    pendingCommission: provider?.pendingCommission ?? 0,
    unpaidJobCount: provider?.unpaidJobCount ?? 0,
    commissions,
  });
});

export default router;
