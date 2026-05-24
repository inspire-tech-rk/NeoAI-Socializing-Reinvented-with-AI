import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  uploadStory,
  getStoriesByUser,
  getFeedStories,
  hasStory,
  deleteStory,
  toggleStoryLike,
  commentOnStory,
} from "../controllers/storyController.js";

const router = express.Router();

// ✅ Upload story
router.post("/", protect, upload.array("files", 10), uploadStory);

// ✅ FEED STORIES (MUST BE BEFORE :userId)
router.get("/feed", protect, getFeedStories);

// ✅ Check if user has story
router.get("/has/:userId", hasStory);

router.post("/:id/like", protect, toggleStoryLike);
router.post("/:id/comment", protect, commentOnStory);

// ✅ Get stories of specific user
router.get("/:userId", getStoriesByUser);

// ✅ Delete story
router.delete("/:id", protect, deleteStory);

export default router;
