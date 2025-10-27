const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // สร้างผู้ใช้ทดสอบ
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: '123456',
        name: 'Test User',
      },
    });

    console.log('✅ Test user created successfully:');
    console.log('Email:', testUser.email);
    console.log('Password: 123456');
    console.log('Name:', testUser.name);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ User with email test@example.com already exists');
    } else {
      console.error('Error creating test user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
