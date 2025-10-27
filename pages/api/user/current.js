import { PrismaClient } from "@prisma/client";
import cors from '../middleware/cors';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS using the middleware
  const shouldReturn = await cors(req, res);
  if (shouldReturn) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user ID from session
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(userId) },
      select: {
        user_id: true,
        email: true,
        name: true,
        profile_image: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ message: 'Error getting current user' });
  }
}
