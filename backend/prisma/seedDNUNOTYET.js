// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const saltRounds = 10; // Or your preferred salt rounds for bcrypt

  // --- Create Admin User ---
  const adminUsername = 'admin';
  const adminEmail = 'admin@example.com'; // Change as needed
  const adminPassword = 'adminpassword'; // Change to a strong default or use environment variables for actual deployments

  const existingAdmin = await prisma.userMain.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    await prisma.userMain.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword, // Store the hashed password
        // Add any other required fields for your User model, e.g., roles, name
        // Example: role: 'ADMIN', 
        // name: 'Administrator',
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);
  }

  // --- Create Developer User ---
  const devUsername = 'developer';
  const devEmail = 'dev@example.com'; // Change as needed
  const devPassword = 'devpassword';   // Change to a strong default

  const existingDeveloper = await prisma.userMain.findUnique({
    where: { email: devEmail },
  });

  if (!existingDeveloper) {
    const hashedPassword = await bcrypt.hash(devPassword, saltRounds);
    await prisma.userMain.create({
      data: {
        username: devUsername,
        email: devEmail,
        password: hashedPassword,
        // Add any other required fields
        // Example: role: 'DEVELOPER',
        // name: 'Developer Account',
      },
    });
    console.log(`Developer user created: ${devEmail}`);
  } else {
    console.log(`Developer user ${devEmail} already exists.`);
  }

  // You can add more users or other seed data here

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