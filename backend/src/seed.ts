import { prisma } from './lib/prisma';

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo customer
  const customer = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      phone: '9876543210',
      name: 'Rahul Sharma',
      address: 'Connaught Place, New Delhi',
      latitude: 28.6315,
      longitude: 77.2167,
    },
  });

  // Create demo provider
  const provider = await prisma.provider.upsert({
    where: { phone: '9988776655' },
    update: {},
    create: {
      phone: '9988776655',
      name: 'Rajan Electricals',
      address: 'Karol Bagh, New Delhi',
      latitude: 28.6519,
      longitude: 77.1909,
      services: JSON.stringify(['electrician', 'appliance_repair']),
      isOnline: false,
      rating: 4.8,
      totalJobsDone: 47,
    },
  });

  const provider2 = await prisma.provider.upsert({
    where: { phone: '9911223344' },
    update: {},
    create: {
      phone: '9911223344',
      name: 'Suresh Plumbing Works',
      address: 'Lajpat Nagar, New Delhi',
      latitude: 28.5700,
      longitude: 77.2436,
      services: JSON.stringify(['plumbing', 'cleaning']),
      isOnline: false,
      rating: 4.6,
      totalJobsDone: 89,
    },
  });

  console.log('✅ Seed complete!');
  console.log('📱 Demo accounts:');
  console.log('  Customer: 9876543210 (any 6-digit OTP in dev mode)');
  console.log('  Provider 1: 9988776655 — Electrician/Appliance Repair');
  console.log('  Provider 2: 9911223344 — Plumbing/Cleaning');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
