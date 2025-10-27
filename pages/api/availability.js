import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // --- Preflight request ---
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    switch(req.method) {
      case "GET": {
        // ถ้ามี userId และ groupId ในคิวรี่ ให้ดึงเฉพาะข้อมูลของ user และ group นั้น
        const { userId, groupId } = req.query;
        const whereClause = {};
        
        if (userId) whereClause.user_id = parseInt(userId);
        if (groupId) whereClause.group_id = parseInt(groupId);
        
        const avails = await prisma.availability.findMany({ 
          where: whereClause,
          include: { user: true, group: true }
        });
        // Serialize ข้อมูล
        const serialized = avails.map(a => ({
          availability_id: a.availability_id,
          user_id: a.user_id,
          group_id: a.group_id,
          start_datetime: a.start_datetime.toISOString(),
          end_datetime: a.end_datetime.toISOString(),
          note: a.note,
          user: a.user ? { user_id: a.user.user_id, email: a.user.email, name: a.user.name } : null,
          group: a.group ? { group_id: a.group.group_id, group_name: a.group.group_name } : null
        }));
        return res.status(200).json(serialized);
      }

      case "POST": {
        const { user_id, group_id, start_datetime, end_datetime, note } = req.body;
        if (!user_id || !group_id || !start_datetime || !end_datetime) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        // Convert local time to UTC for storage
        const startDate = new Date(start_datetime);
        const endDate = new Date(end_datetime);
        
        // Ensure we're storing in UTC
        const startUTC = new Date(Date.UTC(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          startDate.getHours(),
          startDate.getMinutes()
        ));
        
        const endUTC = new Date(Date.UTC(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          endDate.getHours(),
          endDate.getMinutes()
        ));

        // สร้าง availability
        const newAvail = await prisma.availability.create({
          data: {
            user_id,
            group_id,
            start_datetime: startUTC,
            end_datetime: endUTC,
            note
          },
          include: {
            user: true,
            group: {
              include: {
                groupmember: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        });

        // สร้างการแจ้งเตือนให้กับสมาชิกในกลุ่ม
        const notifications = await Promise.all(
          newAvail.group.groupmember
            .filter(member => member.user_id !== user_id) // ไม่ส่งการแจ้งเตือนถึงตัวเอง
            .map(member =>
              prisma.notification.create({
                data: {
                  user_id: member.user_id,
                  group_id,
                  message: `${newAvail.user.name} ได้เพิ่มวันว่างในกลุ่ม ${newAvail.group.group_name} แล้ว`,
                  is_read: false
                }
              })
            )
        );

        return res.status(201).json({
          availability_id: newAvail.availability_id,
          user_id: newAvail.user_id,
          group_id: newAvail.group_id,
          start_datetime: newAvail.start_datetime.toISOString(),
          end_datetime: newAvail.end_datetime.toISOString(),
          note: newAvail.note
        });
      }

      case "PUT": {
        const { availability_id, note: updatedNote } = req.body;
        if (!availability_id || updatedNote == null) {
          return res.status(400).json({ message: "Missing availability_id or note" });
        }
        const updatedAvail = await prisma.availability.update({
          where: { availability_id },
          data: { note: updatedNote }
        });
        return res.status(200).json({
          availability_id: updatedAvail.availability_id,
          user_id: updatedAvail.user_id,
          group_id: updatedAvail.group_id,
          start_datetime: updatedAvail.start_datetime.toISOString(),
          end_datetime: updatedAvail.end_datetime.toISOString(),
          note: updatedAvail.note
        });
      }

      case "DELETE": {
        const { availability_id: delId } = req.body;
        if (!delId) return res.status(400).json({ message: "Missing availability_id" });
        await prisma.availability.delete({ where: { availability_id: delId } });
        return res.status(200).json({ message: "Availability deleted" });
      }

      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch(err) {
    console.error("Error in /api/availability:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
