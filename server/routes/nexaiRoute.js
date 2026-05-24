import express from "express";

import {
  askNexAI,
  getNexAIChats,
  getSingleNexAIChat,
  createNexAIChat,
  deleteNexAIChat,
  clearNexAIChats,
} from "../controllers/nexaiController.js";

const router = express.Router();

router.post("/ask", askNexAI);

router.post("/chat", createNexAIChat);
router.get("/chats/:userId", getNexAIChats);
router.get("/chat/:chatId", getSingleNexAIChat);
router.delete("/chat/:chatId", deleteNexAIChat);

router.delete("/clear/:userId", clearNexAIChats);

export default router;