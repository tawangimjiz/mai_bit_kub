const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting schema update...');
  
  try {
    // ตรวจสอบว่ามี column อยู่แล้วหรือไม่
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'maibitkub' 
        AND TABLE_NAME = 'activity'
    `;
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log('Existing columns:', columnNames);
    
    // เพิ่ม columns ใหม่ถ้ายังไม่มี
    if (!columnNames.includes('max_cost')) {
      await prisma.$executeRaw`
        ALTER TABLE activity ADD COLUMN max_cost FLOAT NOT NULL DEFAULT 0
      `;
      console.log('✓ Added max_cost column');
    } else {
      console.log('⚠ max_cost column already exists');
    }
    
    if (!columnNames.includes('min_cost')) {
      await prisma.$executeRaw`
        ALTER TABLE activity ADD COLUMN min_cost FLOAT NOT NULL DEFAULT 0
      `;
      console.log('✓ Added min_cost column');
    } else {
      console.log('⚠ min_cost column already exists');
    }
    
    // Copy ค่าจาก cost ไปยัง max_cost และ min_cost (ถ้ายังเป็น 0)
    if (columnNames.includes('cost')) {
      await prisma.$executeRaw`
        UPDATE activity 
        SET max_cost = cost * 1.5, 
            min_cost = cost
        WHERE max_cost = 0 AND min_cost = 0
      `;
      console.log('✓ Copied values from cost to max_cost and min_cost');
      
      // ลบ cost column
      await prisma.$executeRaw`
        ALTER TABLE activity DROP COLUMN cost
      `;
      console.log('✓ Removed cost column');
    } else {
      console.log('⚠ cost column does not exist');
    }
    
    console.log('Schema update completed successfully!');
  } catch (error) {
    console.error('Error updating schema:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
