// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // 1. Find your existing user
  //    IMPORTANT: Replace 'your-email@example.com' with the email you use to log in.
  const userEmail = 'arthur@agbintegration.com';
  const user = await prisma.userMain.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.error(`Error: User with email "${userEmail}" not found.`);
    console.error(`Please sign up for an account first or change the email in the seed script.`);
    return;
  }

  console.log(`Found user: ${user.name} (ID: ${user.id})`);

  // 2. Create a new Company
  //    The 'slug' will be used in your URL (e.g., http://acme.localhost:3000)
  const company = await prisma.companyMain.create({
    data: {
      name: 'AGB Integration',
      slug: 'agb', // This will be the subdomain
    },
  });

  console.log(`Created company: ${company.name} with slug "${company.slug}" (ID: ${company.id})`);

  // 3. Link the user to the company with an ADMIN role
  //    This uses the 'CompanyUser' pivot table defined in your schema.
  const companyUserLink = await prisma.companyUser.create({
    data: {
      userId: user.id,
      companyId: company.id,
      role: 'ADMIN', // The CompanyRole enum can be 'ADMIN' or 'MEMBER'
    },
  });

  console.log(`Successfully linked ${user.name} to ${company.name} as an ADMIN.`);
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });