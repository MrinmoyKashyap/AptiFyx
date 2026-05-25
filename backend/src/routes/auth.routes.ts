import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { generateOtp } from '../utils/geo';

const router = Router();

// Send OTP
router.post('/send-otp', async (req: Request, res: Response) => {
  const { phone, role } = req.body;
  if (!phone || !role || !['customer', 'provider'].includes(role)) {
    return res.status(400).json({ error: 'phone and role (customer|provider) required' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  // Invalidate old OTPs for this phone+role
  await prisma.otpRecord.updateMany({
    where: { phone: cleanPhone, role, used: false },
    data: { used: true },
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.otpRecord.create({
    data: { phone: cleanPhone, code, role, expiresAt },
  });

  // In production, integrate SMS gateway here
  console.log(`[OTP] ${cleanPhone} (${role}): ${code}`);

  res.json({
    success: true,
    message: 'OTP sent successfully',
    // Return OTP in dev mode for testing
    ...(process.env.NODE_ENV === 'development' && { otp: code }),
  });
});

// Verify OTP & Login/Register Customer
router.post('/customer/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp, name, address, latitude, longitude } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'phone and otp required' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const record = await prisma.otpRecord.findFirst({
    where: {
      phone: cleanPhone,
      code: otp,
      role: 'customer',
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  await prisma.otpRecord.update({ where: { id: record.id }, data: { used: true } });

  let user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
  const isNewUser = !user;

  if (!user) {
    if (!name) return res.status(400).json({ error: 'Name required for new registration' });
    user = await prisma.user.create({
      data: { phone: cleanPhone, name, address, latitude, longitude },
    });
  }

  const token = jwt.sign(
    { id: user.id, role: 'customer', phone: user.phone },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );

  res.json({ success: true, token, user, isNewUser });
});

// Verify OTP & Login/Register Provider
router.post('/provider/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp, name, address, latitude, longitude, services } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'phone and otp required' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const record = await prisma.otpRecord.findFirst({
    where: {
      phone: cleanPhone,
      code: otp,
      role: 'provider',
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  await prisma.otpRecord.update({ where: { id: record.id }, data: { used: true } });

  let provider = await prisma.provider.findUnique({ where: { phone: cleanPhone } });
  const isNewProvider = !provider;

  if (!provider) {
    if (!name || !services) {
      return res.status(400).json({ error: 'Name and services required for new registration' });
    }
    const servicesJson = Array.isArray(services) ? JSON.stringify(services) : services;
    provider = await prisma.provider.create({
      data: { phone: cleanPhone, name, address, latitude, longitude, services: servicesJson },
    });
  }

  const token = jwt.sign(
    { id: provider.id, role: 'provider', phone: provider.phone },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );

  const providerWithServices = {
    ...provider,
    services: JSON.parse(provider.services || '[]'),
  };

  res.json({ success: true, token, user: providerWithServices, isNewUser: isNewProvider });
});

// Update profile
router.put('/profile', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  let payload: { id: string; role: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as typeof payload;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { name, address, latitude, longitude, services } = req.body;

  if (payload.role === 'customer') {
    const user = await prisma.user.update({
      where: { id: payload.id },
      data: { name, address, latitude, longitude },
    });
    return res.json({ success: true, user });
  } else {
    const servicesJson = services ? JSON.stringify(services) : undefined;
    const provider = await prisma.provider.update({
      where: { id: payload.id },
      data: { name, address, latitude, longitude, ...(servicesJson && { services: servicesJson }) },
    });
    return res.json({
      success: true,
      user: { ...provider, services: JSON.parse(provider.services || '[]') },
    });
  }
});

export default router;
