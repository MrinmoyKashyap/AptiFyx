import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Get customer's current active job
router.get('/active', authenticate, requireRole('customer'), async (req: Request, res: Response) => {
  const job = await prisma.job.findFirst({
    where: {
      customerId: req.user!.id,
      status: { in: ['broadcasting', 'accepted', 'otp_verified', 'in_progress'] },
    },
    include: { provider: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!job) return res.json(null);
  res.json({
    ...job,
    provider: job.provider ? {
      ...job.provider,
      services: JSON.parse(job.provider.services || '[]'),
    } : null,
  });
});

// Customer: create job broadcast
router.post('/broadcast', authenticate, requireRole('customer'), async (req: Request, res: Response) => {
  const { serviceSlug, serviceName, latitude, longitude, address } = req.body;
  if (!serviceSlug || !serviceName || latitude == null || longitude == null) {
    return res.status(400).json({ error: 'serviceSlug, serviceName, latitude, longitude required' });
  }

  // Cancel any existing active job for this customer
  await prisma.job.updateMany({
    where: {
      customerId: req.user!.id,
      status: { in: ['broadcasting', 'accepted', 'otp_verified', 'in_progress'] },
    },
    data: { status: 'cancelled_by_customer' },
  });

  const job = await prisma.job.create({
    data: {
      customerId: req.user!.id,
      serviceSlug,
      serviceName,
      latitude,
      longitude,
      address,
      status: 'broadcasting',
    },
  });

  res.json({ success: true, job });
});

// Customer: cancel job
router.post('/:jobId/cancel', authenticate, requireRole('customer'), async (req: Request, res: Response) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.jobId, customerId: req.user!.id },
  });
  if (!job) return res.status(404).json({ error: 'Job not found' });

  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'cancelled_by_customer' },
  });

  res.json({ success: true });
});

// Customer: verify OTP to start job
router.post('/:jobId/verify-otp', authenticate, requireRole('customer'), async (req: Request, res: Response) => {
  const { otp } = req.body;
  const job = await prisma.job.findFirst({
    where: { id: req.params.jobId, customerId: req.user!.id, status: 'accepted' },
  });
  if (!job) return res.status(404).json({ error: 'No accepted job found' });
  if (job.startOtp !== otp) return res.status(400).json({ error: 'Incorrect OTP' });

  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'in_progress' },
  });

  res.json({ success: true });
});

// Customer: get job history
router.get('/history', authenticate, requireRole('customer'), async (req: Request, res: Response) => {
  const jobs = await prisma.job.findMany({
    where: { customerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { provider: true },
  });
  res.json(jobs.map(j => ({
    ...j,
    provider: j.provider ? {
      ...j.provider,
      services: JSON.parse(j.provider.services || '[]'),
    } : null,
  })));
});

export default router;
