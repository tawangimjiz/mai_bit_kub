import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // --- Preflight request ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    switch(req.method) {
      case "GET": {
        const acts = await prisma.activity.findMany({ include: { user_activities: true } });
        // Serialize
        const serialized = acts.map(a => ({
          activity_id: a.activity_id,
          activity_name: a.activity_name,
          cost: a.cost,
          category: a.category,
          user_activities: a.user_activities.map(ua => ({
            user_id: ua.user_id,
            preference_level: ua.preference_level
          }))
        }));
        return res.status(200).json(serialized);
      }

      case "POST": {
        const { activity_name, cost, category } = req.body;
        if (!activity_name || cost == null || !category) {
          return res.status(400).json({ message: "Missing required fields" });
        }
        const newAct = await prisma.activity.create({ data: { activity_name, cost, category } });
        return res.status(201).json({
          activity_id: newAct.activity_id,
          activity_name: newAct.activity_name,
          cost: newAct.cost,
          category: newAct.category
        });
      }

      case "PUT": {
        const { activity_id, activity_name: newName } = req.body;
        if (!activity_id || !newName) {
          return res.status(400).json({ message: "Missing activity_id or activity_name" });
        }
        const updatedAct = await prisma.activity.update({
          where: { activity_id },
          data: { activity_name: newName }
        });
        return res.status(200).json({
          activity_id: updatedAct.activity_id,
          activity_name: updatedAct.activity_name,
          cost: updatedAct.cost,
          category: updatedAct.category
        });
      }

      case "DELETE": {
        const { activity_id: delId } = req.body;
        if (!delId) return res.status(400).json({ message: "Missing activity_id" });
        await prisma.activity.delete({ where: { activity_id: delId } });
        return res.status(200).json({ message: "Activity deleted" });
      }

      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch(err) {
    console.error("Error in /api/activity:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
