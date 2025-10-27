import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { groupId } = req.query;

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required' });
  }

  try {
    // 1. หาสมาชิกทั้งหมดในกลุ่ม
    const groupMembers = await prisma.groupmember.findMany({
      where: { group_id: parseInt(groupId) },
      include: {
        user: {
          include: {
            useractivity: {
              include: {
                activity: true
              }
            }
          }
        }
      }
    });

    // 2. รวบรวมกิจกรรมที่สมาชิกเลือก
    const activityPreferences = new Map(); // เก็บจำนวนคนที่เลือกแต่ละกิจกรรม
    const categoryPreferences = new Map(); // เก็บจำนวนคนที่เลือกแต่ละหมวดหมู่

    groupMembers.forEach(member => {
      member.user.useractivity.forEach(ua => {
        // นับจำนวนคนที่เลือกแต่ละกิจกรรม
        const activityCount = activityPreferences.get(ua.activity.activity_id) || 0;
        activityPreferences.set(ua.activity.activity_id, activityCount + ua.preference_level);

        // นับจำนวนคนที่เลือกแต่ละหมวดหมู่
        const categoryCount = categoryPreferences.get(ua.activity.category) || 0;
        categoryPreferences.set(ua.activity.category, categoryCount + ua.preference_level);
      });
    });

    // 3. หาหมวดหมู่ที่ได้รับความนิยมสูงสุด
    let popularCategory = '';
    let maxCategoryCount = 0;
    categoryPreferences.forEach((count, category) => {
      if (count > maxCategoryCount) {
        maxCategoryCount = count;
        popularCategory = category;
      }
    });

    // 4. ดึงกิจกรรมที่แนะนำ (จากหมวดหมู่ที่นิยมที่สุด)
    const recommendedActivities = await prisma.activity.findMany({
      where: {
        category: popularCategory
      }
    });

    // 5. จัดอันดับกิจกรรมตามความนิยม
    const rankedActivities = recommendedActivities.map(activity => ({
      ...activity,
      popularity: activityPreferences.get(activity.activity_id) || 0
    })).sort((a, b) => b.popularity - a.popularity);

    return res.status(200).json({
      popularCategory,
      recommendedActivities: rankedActivities
    });

  } catch (error) {
    console.error('Error getting activity recommendations:', error);
    return res.status(500).json({ message: 'Error getting activity recommendations' });
  }
}
