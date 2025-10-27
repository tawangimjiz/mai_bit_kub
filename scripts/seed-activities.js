const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const activities = [
  // SPORT
  { activity_name: 'PINGPONG', cost: 50, category: 'SPORT' },
  { activity_name: 'BOXING', cost: 150, category: 'SPORT' },
  { activity_name: 'SWIMMING', cost: 100, category: 'SPORT' },
  { activity_name: 'SERFING', cost: 300, category: 'SPORT' },
  
  // MUSIC
  { activity_name: 'SINGING', cost: 200, category: 'MUSIC' },
  { activity_name: 'DANCING', cost: 150, category: 'MUSIC' },
  
  // INDOOR
  { activity_name: 'VIDEO GAME', cost: 100, category: 'INDOOR' },
  { activity_name: 'BOARD GAME', cost: 80, category: 'INDOOR' },
  
  // ADVENTURE
  { activity_name: 'HIKING', cost: 50, category: 'ADVENTURE' },
  { activity_name: 'BIKING', cost: 200, category: 'ADVENTURE' },
  { activity_name: 'DIVING', cost: 500, category: 'ADVENTURE' },
  
  // CREATE
  { activity_name: 'PHOTOGRAPHY', cost: 300, category: 'CREATE' },
  { activity_name: 'DRAWING', cost: 100, category: 'CREATE' },
];

async function main() {
  console.log('Start seeding activities...');
  
  for (const activity of activities) {
    // ตรวจสอบว่ามี activity อยู่แล้วหรือไม่
    const existing = await prisma.activity.findFirst({
      where: { activity_name: activity.activity_name },
    });
    
    if (existing) {
      console.log(`Activity already exists: ${activity.activity_name}`);
    } else {
      const result = await prisma.activity.create({
        data: activity,
      });
      console.log(`Created activity: ${result.activity_name}`);
    }
  }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
