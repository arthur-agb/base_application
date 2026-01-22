import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding company plans...');

  const plans = [
    {
      name: 'Free Tier',
      description: 'A basic, free plan with limited features.',
      basePrice: 0,
      currency: 'GBP',
      billingFrequency: 'MONTHLY',
      maxUsers: 3,
      maxBoards: 1,
      maxScheduledIssues: 3,
      maxEpics: 1,
      maxSprints: 1,
      startDate: new Date('2025-01-01'),
    },
    {
      name: 'Pro Tier',
      description: 'Advanced features for professional use.',
      basePrice: 5,
      currency: 'GBP',
      billingFrequency: 'MONTHLY',
      maxUsers: 5,
      maxBoards: 5,
      maxScheduledIssues: 20,
      maxEpics: 10,
      maxSprints: 10,
      startDate: new Date('2025-01-01'),
    },
    {
      name: 'Pro Annual Tier',
      description: 'Advanced features for professional use (Yearly).',
      basePrice: 50,
      currency: 'GBP',
      billingFrequency: 'YEARLY',
      maxUsers: 5,
      maxBoards: 5,
      maxScheduledIssues: 20,
      maxEpics: 10,
      maxSprints: 10,
      startDate: new Date('2025-01-01'),
    },
    {
      name: 'Max Tier',
      description: 'High limits for large organizations.',
      basePrice: 50, // To be determined
      currency: 'GBP',
      billingFrequency: 'MONTHLY',
      maxUsers: 100,
      maxBoards: 100,
      maxScheduledIssues: 1000,
      maxEpics: 100,
      maxSprints: 100,
      startDate: new Date('2025-01-01'),
    },
     {
      name: 'Max Annual Tier',
      description: 'High limits for large organizations (Yearly).',
      basePrice: 500, // To be determined
      currency: 'GBP',
      billingFrequency: 'YEARLY',
      maxUsers: 100,
      maxBoards: 100,
      maxScheduledIssues: 1000,
      maxEpics: 100,
      maxSprints: 100,
      startDate: new Date('2025-01-01'),
    }
  ];

  for (const plan of plans) {
    await prisma.companyPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log('Company plans seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
