import { PrismaClient } from "@prisma/client";
import cors from './middleware/cors';
const prisma = new PrismaClient();

function serializeUser(user) {
  return {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
    budgets: user.budgets?.map(b => ({
      budget_id: b.budget_id,
      amount: b.amount,
    })),
    group_members: user.group_members?.map(gm => ({
      group_id: gm.group_id,
      role: gm.role,
    })),
    user_activities: user.user_activities?.map(a => ({
      activity_id: a.activity_id,
      status: a.status,
    })),
    availabilities: user.availabilities?.map(av => ({
      availability_id: av.availability_id,
      start_datetime: av.start_datetime?.toISOString(),
      end_datetime: av.end_datetime?.toISOString(),
    })),
    groups_created: user.groups_created?.map(g => ({
      group_id: g.group_id,
      name: g.name,
    })),
  };
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case "POST": {
        const { email, name, password } = req.body;
        
        // Validate required fields
        if (!email || !name || !password) {
          return res.status(400).json({ error: "All fields are required" });
        }

        try {
          // Check if email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email }
          });

          if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
          }

          // Create new user
          const newUser = await prisma.user.create({
            data: {
              email,
              name,
              password  // In production, you should hash the password
            }
          });

          return res.status(201).json(serializeUser(newUser));
        } catch (error) {
          console.error('Error creating user:', error);
          return res.status(500).json({ error: "Failed to create user" });
        }
      }

      case "GET": {
        const users = await prisma.user.findMany({
          include: {
            budgets: true,
            group_members: true,
            user_activities: true,
            availabilities: true,
            groups_created: true,
          },
        });
        return res.status(200).json(users.map(serializeUser));
      }

      case "POST": {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
          return res
            .status(400)
            .json({ message: "Missing email, password, or name" });
        }
        const newUser = await prisma.user.create({
          data: { email, password, name },
        });
        return res.status(200).json(serializeUser(newUser));
      }

      case "PUT": {
        const { user_id, name: newName } = req.body;
        if (!user_id || !newName) {
          return res.status(400).json({ message: "Missing user_id or name" });
        }
        const updateUser = await prisma.user.update({
          where: { user_id },
          data: { name: newName },
        });
        return res.status(200).json(serializeUser(updateUser));
      }

      case "DELETE": {
        const { user_id: deleteId } = req.body;
        if (!deleteId) {
          return res.status(400).json({ message: "Missing user_id" });
        }
        await prisma.user.delete({ where: { user_id: deleteId } });
        return res.status(200).json({ message: "User deleted" });
      }

      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err) {
    console.error("Error in /api/user:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}
