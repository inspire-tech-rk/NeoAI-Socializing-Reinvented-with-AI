import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createReel,
  getReels,
  toggleLikeReel,
  trackReelView,
} from "../controllers/reelController.js";

const router = express.Router();

router.post("/", protect, upload.single("media"), createReel);
router.get("/", protect, getReels);
router.post("/:id/like", protect, toggleLikeReel);
router.post("/track", protect, trackReelView);

export default router;