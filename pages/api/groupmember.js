import { PrismaClient } from "@prisma/client";
import cors from './middleware/cors';
const prisma = new PrismaClient();

// helper: serialize groupMember
function serializeGroupMember(member) {
  return {
    user_id: member.user_id,
    group_id: member.group_id,
    role: member.role,
    user: member.user ? { 
      user_id: member.user.user_id, 
      name: member.user.name, 
      email: member.user.email,
      profile_image: member.user.profile_image 
    } : null,
    group: member.group ? { group_id: member.group.group_id, name: member.group.name } : null,
  };
}

export default async function handler(req, res) {
  // Enable CORS using the middleware
  const shouldReturn = await cors(req, res);
  if (shouldReturn) {
    return;
  }

  try {
    switch(req.method) {
      case "GET": {
        const { groupId } = req.query;
        
        // ถ้ามี groupId ให้กรองตาม group_id
        const whereClause = groupId ? { group_id: parseInt(groupId) } : {};
        
        const members = await prisma.groupmember.findMany({ 
          where: whereClause,
          include: { 
            user: {
              select: {
                user_id: true,
                name: true,
                email: true,
                profile_image: true
              }
            }, 
            group: {
              select: {
                group_id: true,
                group_name: true
              }
            } 
          } 
        });
        return res.status(200).json(members.map(serializeGroupMember));
      }

      case "POST": {
        const { user_id, group_id, role } = req.body;
        if (!user_id || !group_id || !role) {
          return res.status(400).json({ message: "Missing user_id, group_id, or role" });
        }
        const newMember = await prisma.groupmember.create({
          data: { user_id, group_id, role },
        });
        const fullMember = await prisma.groupmember.findUnique({
          where: { user_id_group_id: { user_id, group_id } },
          include: { user: true, group: true }
        });
        return res.status(201).json(serializeGroupMember(fullMember));
      }

      case "PUT": {
        const { user_id, group_id, role } = req.body;
        if (!user_id || !group_id || !role) {
          return res.status(400).json({ message: "Missing user_id, group_id, or role" });
        }
        const updatedMember = await prisma.groupmember.update({
          where: { user_id_group_id: { user_id, group_id } },
          data: { role },
          include: { user: true, group: true }
        });
        return res.status(200).json(serializeGroupMember(updatedMember));
      }

      case "DELETE": {
        const { user_id, group_id } = req.body;
        if (!user_id || !group_id) {
          return res.status(400).json({ message: "Missing user_id or group_id" });
        }
        await prisma.groupmember.delete({ where: { user_id_group_id: { user_id, group_id } } });
        return res.status(200).json({ message: "Group member deleted" });
      }

      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch(err) {
    console.error("Error in /api/groupMember:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
