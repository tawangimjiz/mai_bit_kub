// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// export default async function handler(req, res) {
//   // --- CORS headers ---
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");

//   // --- Preflight request ---
//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }


//   try {
//     switch(req.method) {
//       case "GET": {
//         const budgets = await prisma.budget.findMany({ include: { user: true } });
//         // Serialize ข้อมูลก่อนส่งกลับ
//         const serialized = budgets.map(b => ({
//           budget_id: b.budget_id,
//           user_id: b.user_id,
//           min_budget: Number(b.min_budget),
//           max_budget: Number(b.max_budget),
//           user: b.user ? {
//             user_id: b.user.user_id,
//             email: b.user.email,
//             name: b.user.name
//           } : null
//         }));
//         return res.status(200).json(serialized);
//       }

//       // case "POST": {
//       //   const { user_id, min_budget, max_budget } = req.body;
//       //   if (!user_id || min_budget == null || max_budget == null) {
//       //     return res.status(400).json({ message: "Missing user_id, min_budget or max_budget" });
//       //   }
//       //   const newBudget = await prisma.budget.create({
//       //     data: { user_id, min_budget, max_budget }
//       //   });
//       //   return res.status(201).json({
//       //     budget_id: newBudget.budget_id,
//       //     user_id: newBudget.user_id,
//       //     min_budget: Number(newBudget.min_budget),
//       //     max_budget: Number(newBudget.max_budget)
//       //   });
//       // }

//       case "POST": {
//   const { user_id, max_budget, min_budget } = req.body;
//   if (!user_id || max_budget == null || min_budget == null) {
//     return res.status(400).json({ message: "Missing user_id, max_budget, or min_budget" });
//   }
//   const newBudget = await prisma.budget.create({
//     data: { user_id, max_budget, min_budget }
//   });
//   return res.status(201).json({
//     budget_id: newBudget.budget_id,
//     user_id: newBudget.user_id,
//     max_budget: Number(newBudget.max_budget),
//     min_budget: Number(newBudget.min_budget)
//   });
// }


//       case "PUT": {
//         const { budget_id, min_budget: newMin, max_budget: newMax } = req.body;
//         if (!budget_id || newMin == null || newMax == null) {
//           return res.status(400).json({ message: "Missing budget_id, min_budget or max_budget" });
//         }
//         const updatedBudget = await prisma.budget.update({
//           where: { budget_id },
//           data: { min_budget: newMin, max_budget: newMax }
//         });
//         return res.status(200).json({
//           budget_id: updatedBudget.budget_id,
//           user_id: updatedBudget.user_id,
//           min_budget: Number(updatedBudget.min_budget),
//           max_budget: Number(updatedBudget.max_budget)
//         });
//       }

//       case "DELETE": {
//         const { budget_id: delId } = req.body;
//         if (!delId) return res.status(400).json({ message: "Missing budget_id" });
//         await prisma.budget.delete({ where: { budget_id: delId } });
//         return res.status(200).json({ message: "Budget deleted" });
//       }

//       default:
//         return res.status(405).json({ message: "Method Not Allowed" });
//     }
//   } catch(err) {
//     console.error("Error in /api/budget:", err);
//     return res.status(500).json({ message: "Internal Server Error", error: err.message });
//   }
// }



import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    switch (req.method) {
      case "GET": {
        const budgets = await prisma.budget.findMany({ 
          include: { 
            user: {
              select: {
                user_id: true,
                email: true,
                name: true
              }
            } 
          } 
        });
        const serialized = budgets.map(b => ({
          budget_id: b.budget_id,
          user_id: b.user_id,
          min_budget: Number(b.min_budget),
          max_budget: Number(b.max_budget),
          user: b.user ? { user_id: b.user.user_id, email: b.user.email, name: b.user.name } : null
        }));
        return res.status(200).json(serialized);
      }

      case "POST": {
        console.log("POST body:", req.body);
        const { user_id, min_budget, max_budget } = req.body;
        if (!user_id || min_budget == null || max_budget == null) {
          return res.status(400).json({ message: "Missing user_id, min_budget, or max_budget" });
        }

        const newBudget = await prisma.budget.create({
          data: { user_id, min_budget, max_budget }
        });

        return res.status(201).json({
          budget_id: newBudget.budget_id,
          user_id: newBudget.user_id,
          min_budget: Number(newBudget.min_budget),
          max_budget: Number(newBudget.max_budget)
        });
      }

      case "PUT": {
        console.log("PUT body:", req.body);
        const { budget_id, min_budget: newMin, max_budget: newMax } = req.body;
        if (!budget_id || newMin == null || newMax == null) {
          return res.status(400).json({ message: "Missing budget_id, min_budget, or max_budget" });
        }

        const updatedBudget = await prisma.budget.update({
          where: { budget_id },
          data: { min_budget: newMin, max_budget: newMax }
        });

        return res.status(200).json({
          budget_id: updatedBudget.budget_id,
          user_id: updatedBudget.user_id,
          min_budget: Number(updatedBudget.min_budget),
          max_budget: Number(updatedBudget.max_budget)
        });
      }

      case "DELETE": {
        const { budget_id } = req.body;
        if (!budget_id) return res.status(400).json({ message: "Missing budget_id" });

        await prisma.budget.delete({ where: { budget_id } });
        return res.status(200).json({ message: "Budget deleted" });
      }

      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err) {
    console.error("Error in /api/budget:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
