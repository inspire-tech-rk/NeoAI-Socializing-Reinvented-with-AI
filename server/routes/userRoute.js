import express from "express";
import {
  updateProfile,
  getSuggestions,
  toggleFollow,
  getChatUsers,
  removeFollower,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { getUserProfile } from "../controllers/userController.js";

const router = express.Router();

/* -------------------- UPDATE PROFILE -------------------- */
router.put("/me", protect, upload.single("dp"), updateProfile);

/* -------------------- SUGGESTIONS -------------------- */
router.get("/suggestions", protect, getSuggestions);

/* -------------------- FOLLOW / UNFOLLOW -------------------- */
router.post("/:userId/follow", protect, toggleFollow);

router.post("/:userId/remove-follower", protect, removeFollower);

/* -------------------- PROFILE -------------------- */
router.get("/:userId", protect, getUserProfile);

/* -------------------- CHAT USERS -------------------- */
router.get("/chat-users", protect, getChatUsers);

export default router;
