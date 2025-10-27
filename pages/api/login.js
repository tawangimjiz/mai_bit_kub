import { PrismaClient } from "@prisma/client";
import cors from './middleware/cors';
const prisma = new PrismaClient();

function serializeUser(user) {
  return {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    created_at: user.created_at?.toISOString()
  };
}

export default async function handler(req, res) {
  // Enable CORS using the middleware
  const shouldReturn = await cors(req, res);
  if (shouldReturn) {
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        user_id: true,
        email: true,
        password: true,
        name: true,
        created_at: true
      }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.status(200).json({ message: "Login successful", user: serializeUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
