import express from "express";
import {
  createComment,
  getComments,
  deleteComment,
  updateComment
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createComment);
router.get("/:targetType/:targetId", protect, getComments);
router.delete("/:id", protect, deleteComment);
router.put("/:id", protect, updateComment);
 
export default router;
