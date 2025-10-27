import { PrismaClient } from '@prisma/client';
import initMiddleware from './middleware/cors';

const prisma = new PrismaClient();

async function handler(req, res) {
  // Handle CORS
  await initMiddleware(req, res);
  if (req.method === 'POST') {
    // สร้างการนัดกิจกรรมใหม่
    try {
      const { groupId, activityId, startDatetime, endDatetime, createdBy } = req.body;
      
      console.log('Received data:', { groupId, activityId, startDatetime, endDatetime, createdBy });

      let scheduledActivity;
      try {
        scheduledActivity = await prisma.scheduled_activity.create({
          data: {
            group_id: parseInt(groupId),
            activity_id: parseInt(activityId),
            start_datetime: new Date(startDatetime),
            end_datetime: new Date(endDatetime),
            status: 'scheduled',
            created_by: parseInt(createdBy)
          },
          include: {
            activity: true,
            group: true,
            creator: true
          }
        });
        console.log('Created activity:', scheduledActivity);
      } catch (error) {
        console.error('Error creating scheduled activity:', error);
        res.status(500).json({ error: `Failed to create scheduled activity: ${error.message}` });
        return;
      }

      // สร้าง notification สำหรับสมาชิกในกลุ่ม
      const groupMembers = await prisma.groupmember.findMany({
        where: {
          group_id: parseInt(groupId)
        }
      });

      try {
        // สร้าง notifications สำหรับทุกคนในกลุ่ม
        await Promise.all(groupMembers.map(member => {
          return prisma.notification.create({
            data: {
              user_id: member.user_id,
              group_id: parseInt(groupId),
              message: `มีการนัดกิจกรรม ${scheduledActivity.activity.activity_name} ในวันที่ ${new Date(startDatetime).toLocaleDateString('th-TH')} เวลา ${new Date(startDatetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
            }
          });
        }));
      } catch (error) {
        console.error('Error creating notifications:', error);
        // ไม่ต้อง return error เพราะถ้า notification ไม่สำเร็จก็ไม่เป็นไร activity ยังสร้างสำเร็จ
      }

      res.status(201).json(scheduledActivity);
    } catch (error) {
      console.error('Error scheduling activity:', error);
      res.status(500).json({ error: 'Failed to schedule activity' });
    }
  } else if (req.method === 'GET') {
    // ดึงข้อมูลกิจกรรมที่นัดไว้
    try {
      const { groupId } = req.query;
      
      const scheduledActivities = await prisma.scheduled_activity.findMany({
        where: {
          group_id: parseInt(groupId)
        },
        include: {
          activity: true,
          group: true,
          creator: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          start_datetime: 'asc'
        }
      });

      res.status(200).json(scheduledActivities);
    } catch (error) {
      console.error('Error fetching scheduled activities:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled activities' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default handler;