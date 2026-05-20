import express from "express";
import { deleteMessage, markAsSeen } from "../controllers/messageController.js";

import {
  sendMessage,
  getMessages,
  getMutualUsers,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";  // ✅ your existing middleware

const router = express.Router();

/* IMPORTANT: static before dynamic */
router.get("/mutual", protect, getMutualUsers);

/* SEND MESSAGE WITH MEDIA */
router.post(
  "/",
  protect,
  upload.single("media"),   // ✅ this is required
  sendMessage
);

router.get("/:userId", protect, getMessages);
router.delete("/:id", protect, deleteMessage);
router.put("/seen/:userId", protect, markAsSeen);


export default router;
