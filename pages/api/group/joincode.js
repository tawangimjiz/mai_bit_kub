import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// helper: generate random join code
function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // --- Preflight request ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      // Generate join code for a group
      case "POST": {
        const { group_id, user_id } = req.body;
        
        if (!group_id || !user_id) {
          return res.status(400).json({ message: "Missing group_id or user_id" });
        }

        // Check if user is the group creator or admin
        const group = await prisma.group.findUnique({
          where: { group_id: parseInt(group_id) },
          include: { groupmember: true }
        });

        if (!group) {
          return res.status(404).json({ message: "Group not found" });
        }

        const member = group.groupmember.find(m => m.user_id === parseInt(user_id));
        if (group.created_by !== parseInt(user_id) && (!member || member.role !== 'admin')) {
          return res.status(403).json({ message: "Only group creator or admin can generate join code" });
        }

        // Generate unique join code
        const joinCode = generateJoinCode();
        console.log('Generated join code:', joinCode);

        // Check if code exists (excluding current group)
        const existing = await prisma.group.findFirst({
          where: {
            AND: [
              { join_code: joinCode },
              { group_id: { not: parseInt(group_id) } }
            ]
          }
        });

        if (existing) {
          return res.status(409).json({ message: "Failed to generate unique join code, please try again" });
        }

        // Update group with new join code
        try {
          const updatedGroup = await prisma.group.update({
            where: { 
              group_id: parseInt(group_id) 
            },
            data: { 
              join_code: joinCode 
            }
          });

          console.log('Group updated successfully:', updatedGroup);
          return res.status(200).json({ 
            message: "Join code generated successfully",
            join_code: updatedGroup.join_code 
          });
        } catch (error) {
          console.error('Error updating group:', error);
          return res.status(500).json({ 
            message: "Failed to update group with new join code",
            error: error.message 
          });
        }
      }

      // Join group using join code
      case "PUT": {
        const { join_code, user_id } = req.body;

        if (!join_code || !user_id) {
          return res.status(400).json({ message: "Missing join_code or user_id" });
        }

        // Find group by join code
        const group = await prisma.group.findFirst({
          where: { join_code: join_code.toUpperCase() },
          include: { groupmember: true }
        });

        if (!group) {
          return res.status(404).json({ message: "Invalid join code" });
        }

        // Check if user is already a member
        const existingMember = group.groupmember.find(m => m.user_id === parseInt(user_id));
        if (existingMember) {
          return res.status(400).json({ message: "You are already a member of this group" });
        }

        // Check if group is full
        if (group.groupmember.length >= group.max_members) {
          return res.status(400).json({ message: "Group is full" });
        }

        // Add user to group
        await prisma.groupmember.create({
          data: {
            user_id: parseInt(user_id),
            group_id: group.group_id,
            role: 'member'
          }
        });

        return res.status(200).json({ 
          message: "Successfully joined the group",
          group_name: group.group_name,
          group_id: group.group_id
        });
      }

      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err) {
    console.error("Error in /api/group/joincode:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
