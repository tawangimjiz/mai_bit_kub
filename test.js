const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("\n=== START DATABASE TEST ===");

  // 1️⃣ CREATE USER
  const user = await prisma.user.create({
    data: {
      email: "bob@example.com",
      password: "1234",
      name: "Bob",
    },
  });
  console.log("✅ Created User:", user);

  // 2️⃣ CREATE GROUP
  const group = await prisma.group.create({
    data: {
      group_name: "Weekend Trip",
      max_members: 5,
      created_by: user.user_id,
    },
  });
  console.log("✅ Created Group:", group);

  // 3️⃣ ADD GROUP MEMBER
  const groupMember = await prisma.groupMember.create({
    data: {
      user_id: user.user_id,
      group_id: group.group_id,
      role: "Leader",
    },
  });
  console.log("✅ Added Group Member:", groupMember);

  // 4️⃣ CREATE ACTIVITY
  const activity = await prisma.activity.create({
    data: {
      activity_name: "Hiking",
      cost: 50,
      category: "Outdoor",
    },
  });
  console.log("✅ Created Activity:", activity);

  // 5️⃣ LINK USER TO ACTIVITY
  const userActivity = await prisma.userActivity.create({
    data: {
      user_id: user.user_id,
      activity_id: activity.activity_id,
      preference_level: 5,
    },
  });
  console.log("✅ Linked UserActivity:", userActivity);

  // 6️⃣ CREATE AVAILABILITY
  const availability = await prisma.availability.create({
    data: {
      user_id: user.user_id,
      group_id: group.group_id,
      start_datetime: new Date("2025-10-15T10:00:00"),
      end_datetime: new Date("2025-10-15T18:00:00"),
      note: "Available after class",
    },
  });
  console.log("✅ Created Availability:", availability);

  // 7️⃣ CREATE BUDGET
  const budget = await prisma.budget.create({
    data: {
      user_id: user.user_id,
      max_budget: 1000.00,
    },
  });
  console.log("✅ Created Budget:", budget);

  // 8️⃣ READ USER WITH RELATIONS
  const userDetails = await prisma.user.findUnique({
    where: { user_id: user.user_id },
    include: {
      groups_created: true,
      group_members: true,
      user_activities: true,
      availabilities: true,
      budgets: true,
    },
  });
  console.log("📘 User with all details:", userDetails);

  // 9️⃣ UPDATE GROUP NAME
  const updatedGroup = await prisma.group.update({
    where: { group_id: group.group_id },
    data: { group_name: "Mountain Adventure" },
  });
  console.log("✏️ Updated Group:", updatedGroup);

  // 🔟 DELETE (เรียงลบตามความสัมพันธ์)
  await prisma.groupMember.deleteMany({ where: { group_id: group.group_id } });
  await prisma.availability.deleteMany({ where: { group_id: group.group_id } });
  await prisma.userActivity.deleteMany({ where: { user_id: user.user_id } });
  await prisma.budget.deleteMany({ where: { user_id: user.user_id } });
  await prisma.activity.delete({ where: { activity_id: activity.activity_id } });
  await prisma.group.delete({ where: { group_id: group.group_id } });
  await prisma.user.delete({ where: { user_id: user.user_id } });

  console.log("🗑️ Cleaned up test data");

  console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
}

main()
  .catch((e) => console.error("❌ Error:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
