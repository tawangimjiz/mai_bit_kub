import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Configure body parser size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function serializeUser(user) {
  return {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    profile_image: user.profile_image,
    created_at: user.created_at?.toISOString()
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

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { user_id: parseInt(id) }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(serializeUser(user));
    }

    if (req.method === 'PUT') {
      const { name, email, current_password, new_password, profile_image } = req.body;
      const updateData = {};

      // Only include fields that were provided
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (profile_image !== undefined) updateData.profile_image = profile_image;
      
      // Handle password update separately if needed
      if (new_password && current_password) {
        // Add password validation logic here
        updateData.password = new_password;
      }

      const updatedUser = await prisma.user.update({
        where: { user_id: parseInt(id) },
        data: updateData
      });

      return res.status(200).json(serializeUser(updatedUser));
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}