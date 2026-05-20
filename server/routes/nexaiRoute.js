import express from "express";

import {
  askNexAI,
  getNexAIChats,
  clearNexAIChats,
} from "../controllers/nexaiController.js";

const router = express.Router();

// ✅ Ask AI
router.post("/ask", askNexAI);
router.delete("/clear/:userId", clearNexAIChats);

// ✅ Get chats
router.get("/history/:userId", getNexAIChats);

export default router;