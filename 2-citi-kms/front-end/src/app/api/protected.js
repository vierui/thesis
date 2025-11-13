// pages/api/protected.ts
import { requireAuth } from "@clerk/clerk-sdk-node";

const handler = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId parameter" });
  }

  res.status(200).json({ message: `Hello, user ${userId}` });
};

export default requireAuth(handler);
