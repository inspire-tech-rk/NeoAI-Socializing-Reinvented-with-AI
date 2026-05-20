import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { createPost, myPosts, getFeed, deletePost, getUserPosts,toggleLikePost } from "../controllers/postController.js";

const router = express.Router();

router.post("/", protect, upload.single("file"), createPost);
router.get("/me", protect, myPosts);
router.get("/feed", protect, getFeed);
router.get("/user/:id", protect, getUserPosts);
router.delete("/:id", protect, deletePost);
router.post("/:id/like", protect, toggleLikePost);


export default router;
