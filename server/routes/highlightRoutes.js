import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createHighlight,
  getUserHighlights,
  deleteHighlight,
  addStoryToHighlight,
} from "../controllers/highlightController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  upload.array("files", 10),
  createHighlight
);

router.post("/add-story", protect, addStoryToHighlight);
router.get("/:userId", getUserHighlights);
router.delete("/:id", protect, deleteHighlight);

export default router;
