// utils/seeder.js
import bcrypt from 'bcryptjs';
import prisma from './prismaClient.js';
import 'dotenv/config';

const seedData = async () => {
  try {
    await prisma.userMain.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.board.deleteMany({});
    await prisma.column.deleteMany({});
    await prisma.momentumIssue.deleteMany({});

    console.log('Previous data cleared');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = await prisma.userMain.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        avatarUrl: `https://ui-avatars.com/api/?name=Admin+User&background=random`,
      },
    });

    const regularUserPassword = await bcrypt.hash('user123', salt);
    const regularUser = await prisma.userMain.create({
      data: {
        name: 'Regular User',
        email: 'user@example.com',
        password: regularUserPassword,
        role: 'USER',
        avatarUrl: `https://ui-avatars.com/api/?name=Regular+User&background=random`,
      },
    });

    console.log('Users created');

    const project = await prisma.project.create({
      data: {
        name: 'Sample Project',
        key: 'SAMPLE',
        description: 'This is a sample project for demonstration',
        lead: { connect: { id: adminUser.id } },
        members: {
          connect: [{ id: adminUser.id }, { id: regularUser.id }],
        },
      },
    });

    console.log('Project created');

    const board = await prisma.board.create({
      data: {
        name: 'Main Board',
        project: { connect: { id: project.id } },
        type: 'KANBAN',
      },
    });

    console.log('Board created');

    const columns = await prisma.column.createMany({
      data: [
        { name: 'To Do', boardId: board.id, position: 0 },
        { name: 'In Progress', boardId: board.id, position: 1 },
        { name: 'Done', boardId: board.id, position: 2 },
      ],
    });
    const createdColumns = await prisma.column.findMany({ where: { boardId: board.id } });
    const todoColumn = createdColumns.find(col => col.name === 'To Do');
    const inProgressColumn = createdColumns.find(col => col.name === 'In Progress');
    const doneColumn = createdColumns.find(col => col.name === 'Done');

    console.log('Columns created');

    await prisma.momentumIssue.create({
      data: {
        title: 'Set up project repository',
        description: 'Create GitHub repository and set up initial project structure',
        type: 'task',
        priority: 'high',
        status: 'TODO',
        reporter: { connect: { id: adminUser.id } },
        assignee: { connect: { id: adminUser.id } },
        project: { connect: { id: project.id } },
        column: { connect: { id: todoColumn.id } },
      },
    });

    await prisma.momentumIssue.create({
      data: {
        title: 'Design database schema',
        description: 'Create PostgreSQL schemas for the application',
        type: 'task',
        priority: 'medium',
        status: 'TODO',
        reporter: { connect: { id: adminUser.id } },
        assignee: { connect: { id: regularUser.id } },
        project: { connect: { id: project.id } },
        column: { connect: { id: todoColumn.id } },
      },
    });

    await prisma.momentumIssue.create({
      data: {
        title: 'Implement user authentication',
        description: 'Create login and registration API endpoints',
        type: 'feature',
        priority: 'high',
        status: 'IN_PROGRESS',
        reporter: { connect: { id: adminUser.id } },
        assignee: { connect: { id: adminUser.id } },
        project: { connect: { id: project.id } },
        column: { connect: { id: inProgressColumn.id } },
      },
    });

    await prisma.momentumIssue.create({
      data: {
        title: 'Project requirements gathering',
        description: 'Collect and document all project requirements',
        type: 'task',
        priority: 'high',
        status: 'DONE',
        reporter: { connect: { id: adminUser.id } },
        assignee: { connect: { id: regularUser.id } },
        project: { connect: { id: project.id } },
        column: { connect: { id: doneColumn.id } },
      },
    });

    console.log('Sample issues created');
    console.log('Database seeded successfully!');
    console.log('\nYou can now log in with:');
    console.log('Admin User: admin@example.com / admin123');
    console.log('Regular User: user@example.com / user123');
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
};

seedData();
