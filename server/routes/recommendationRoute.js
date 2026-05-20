import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  trackView,
  getRecommendations,
} from "../controllers/recommendationController.js";

const router = express.Router();

router.post("/track", protect, trackView);
router.get("/", protect, getRecommendations);

export default router;
