import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ✅ ฟังก์ชันช่วย serialize ข้อมูลให้สวย ๆ
function serializeFriendship(friendship) {
  return {
    friendship_id: friendship.friendship_id,
    requester_id: friendship.requester_id,
    addressee_id: friendship.addressee_id,
    status: friendship.status,
    created_at: friendship.created_at.toISOString(),
  };
}

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    switch (req.method) {
      // ✅ GET: ดูรายการเพื่อนของ user
      case "GET": {
        const { user_id } = req.query;
        if (!user_id)
          return res.status(400).json({ message: "Missing user_id" });

        const friends = await prisma.friendship.findMany({
          where: {
            OR: [
              { requester_id: parseInt(user_id) },
              { addressee_id: parseInt(user_id) },
            ],
          },
        });

        return res.status(200).json(friends.map(serializeFriendship));
      }

      // ✅ POST: ส่งคำขอเป็นเพื่อน
      case "POST": {
        const { requester_id, addressee_id } = req.body;
        if (!requester_id || !addressee_id)
          return res
            .status(400)
            .json({ message: "Missing requester_id or addressee_id" });

        const existing = await prisma.friendship.findUnique({
          where: {
            requester_id_addressee_id: {
              requester_id,
              addressee_id,
            },
          },
        });

        if (existing)
          return res
            .status(400)
            .json({ message: "Friend request already sent" });

        const newFriendship = await prisma.friendship.create({
          data: {
            requester_id,
            addressee_id,
          },
        });

        return res.status(200).json(serializeFriendship(newFriendship));
      }

      // ✅ PUT: ยอมรับหรือปฏิเสธคำขอเป็นเพื่อน
      case "PUT": {
        const { friendship_id, status } = req.body;
        if (!friendship_id || !status)
          return res
            .status(400)
            .json({ message: "Missing friendship_id or status" });

        const updated = await prisma.friendship.update({
          where: { friendship_id },
          data: { status },
        });

        return res.status(200).json(serializeFriendship(updated));
      }

      // ✅ DELETE: ยกเลิกหรือ unfriend
      case "DELETE": {
        const { friendship_id } = req.body;
        if (!friendship_id)
          return res.status(400).json({ message: "Missing friendship_id" });

        await prisma.friendship.delete({ where: { friendship_id } });
        return res.status(200).json({ message: "Friendship deleted" });
      }

      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (err) {
    console.error("Error in /api/friend:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}
