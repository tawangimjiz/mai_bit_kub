import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { name } = req.query;
  if (!name) return res.status(400).json({ message: "Missing activity name" });

  try {
    // เปลี่ยนจาก findUnique เป็น findFirst
    const activity = await prisma.activity.findFirst({
      where: { activity_name: name },
    });

    if (!activity) return res.status(404).json({ message: "Activity not found" });

    res.status(200).json(activity);
  } catch (err) {
    console.error("Error in /api/activity/by-name:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
