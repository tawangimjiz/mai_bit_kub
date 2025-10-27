import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// helper: serialize UserActivity ให้ JSON-safe
function serializeUserActivity(ua) {
  return {
    user_id: ua.user_id,
    activity_id: ua.activity_id,
    preference_level: ua.preference_level,
    user: ua.user
      ? { user_id: ua.user.user_id, name: ua.user.name, email: ua.user.email }
      : null,
    activity: ua.activity
      ? {
          activity_id: ua.activity.activity_id,
          name: ua.activity.activity_name,
          min_cost: ua.activity.min_cost != null ? Number(ua.activity.min_cost) : null,
          max_cost: ua.activity.max_cost != null ? Number(ua.activity.max_cost) : null,
        }
      : null,
  };
}

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");


  // --- Preflight request ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case "GET": {
        // support optional filtering by userId
        const { userId } = req.query;
        const where = {};
        if (userId) where.user_id = parseInt(userId, 10);

        const uas = await prisma.useractivity.findMany({
          where,
          include: { user: true, activity: true },
        });
        return res.status(200).json(uas.map(serializeUserActivity));
      }

      case "POST": {
        const { user_id, activity_id, preference_level } = req.body;
        if (!user_id || !activity_id || preference_level == null) {
          return res
            .status(400)
            .json({ message: "Missing user_id, activity_id, or preference_level" });
        }

        try {
          const newUA = await prisma.useractivity.create({
            data: { user_id, activity_id, preference_level },
          });

          const fullUA = await prisma.useractivity.findUnique({
            where: { user_id_activity_id: { user_id, activity_id } },
            include: { user: true, activity: true },
          });

          return res.status(201).json(serializeUserActivity(fullUA));
        } catch (e) {
          // Handle unique constraint (user already has this activity)
          // Prisma unique-constraint error code is P2002
          if (e.code === 'P2002') {
            return res.status(409).json({ message: 'UserActivity already exists' });
          }
          throw e; // rethrow other errors to be handled by outer catch
        }
      }

      case "PUT": {
        const { user_id, activity_id, preference_level } = req.body;
        if (!user_id || !activity_id || preference_level == null) {
          return res
            .status(400)
            .json({ message: "Missing user_id, activity_id, or preference_level" });
        }

        const updatedUA = await prisma.useractivity.update({
          where: { user_id_activity_id: { user_id, activity_id } },
          data: { preference_level },
          include: { user: true, activity: true },
        });

        return res.status(200).json(serializeUserActivity(updatedUA));
      }

      case "DELETE": {
        const { user_id, activity_id } = req.body;
        if (!user_id || !activity_id) {
          return res
            .status(400)
            .json({ message: "Missing user_id or activity_id" });
        }

        await prisma.useractivity.delete({
          where: { user_id_activity_id: { user_id, activity_id } },
        });

        return res.status(200).json({ message: "UserActivity deleted" });
      }

      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err) {
    console.error("Error in /api/userActivity:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}
