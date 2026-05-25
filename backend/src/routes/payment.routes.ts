import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

const COMMISSION_AMOUNT = Number(process.env.COMMISSION_AMOUNT) || 20;
const MAX_UNPAID_JOBS = Number(process.env.MAX_UNPAID_JOBS) || 2;

// Get pending commissions
router.get('/pending', authenticate, requireRole('provider'), async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { id: req.user!.id } });
  const pendingItems = await prisma.commission.findMany({
    where: { providerId: req.user!.id, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    totalPending: provider?.pendingCommission ?? 0,
    unpaidJobCount: provider?.unpaidJobCount ?? 0,
    maxUnpaidJobs: MAX_UNPAID_JOBS,
    canAcceptMoreJobs: (provider?.unpaidJobCount ?? 0) <= MAX_UNPAID_JOBS,
    items: pendingItems,
  });
});

// Pay commission (dummy payment)
router.post('/pay', authenticate, requireRole('provider'), async (req: Request, res: Response) => {
  const { commissionIds, payAll } = req.body;

  const provider = await prisma.provider.findUnique({ where: { id: req.user!.id } });
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  let whereClause: object = { providerId: req.user!.id, status: 'pending' };
  if (!payAll && Array.isArray(commissionIds) && commissionIds.length > 0) {
    whereClause = { ...whereClause, id: { in: commissionIds } };
  }

  const items = await prisma.commission.findMany({ where: whereClause });
  const totalAmount = items.reduce((sum, c) => sum + c.amount, 0);

  if (items.length === 0) {
    return res.status(400).json({ error: 'No pending commissions found' });
  }

  await prisma.commission.updateMany({
    where: whereClause,
    data: { status: 'paid', paidAt: new Date() },
  });

  await prisma.provider.update({
    where: { id: req.user!.id },
    data: {
      pendingCommission: { decrement: totalAmount },
      unpaidJobCount: payAll ? 0 : { decrement: items.length },
    },
  });

  res.json({
    success: true,
    message: `Payment of ₹${totalAmount} processed successfully`,
    paidCount: items.length,
    totalAmount,
  });
});

// Pay later (just acknowledge)
router.post('/pay-later', authenticate, requireRole('provider'), async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { id: req.user!.id } });
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  const remaining = MAX_UNPAID_JOBS - provider.unpaidJobCount;
  res.json({
    success: true,
    message: `Payment deferred. You can accept ${remaining} more job(s) before payment is required.`,
    unpaidJobCount: provider.unpaidJobCount,
    maxUnpaidJobs: MAX_UNPAID_JOBS,
    canAcceptMoreJobs: provider.unpaidJobCount < MAX_UNPAID_JOBS,
  });
});

export default router;
