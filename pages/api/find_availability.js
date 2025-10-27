import { PrismaClient } from "@prisma/client";
import cors from "./middleware/cors";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  await cors(req, res);

  if (req.method === "GET") {
    try {
      const { groupId } = req.query;

      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }

      // Get group information and group members
      const group = await prisma.group.findUnique({
        where: {
          group_id: parseInt(groupId)
        },
        select: {
          group_id: true,
          group_name: true,
          max_members: true,
          created_at: true,
          groupmember: {
            select: {
              user_id: true,
              role: true
            }
          }
        }
      });

      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Get all availabilities for this group with user information
      const availabilities = await prisma.availability.findMany({
        where: {
          group_id: parseInt(groupId)
        },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          start_datetime: 'asc'
        }
      });

      // Convert dates to ISO strings before sending
      const serializedAvailabilities = availabilities.map(a => ({
        ...a,
        start_datetime: a.start_datetime.toISOString(),
        end_datetime: a.end_datetime.toISOString()
      }));

      return res.status(200).json({
        group,
        availabilities: serializedAvailabilities
      });
    } catch (error) {
      console.error("Error fetching group availability:", error);
      return res.status(500).json({ 
        message: "Failed to fetch group availability",
        error: error.message 
      });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}