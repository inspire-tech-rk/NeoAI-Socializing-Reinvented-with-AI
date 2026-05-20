import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCollection,
  getMyCollections,
  addPostToCollection,
  removePostFromCollection,
  getCollectionPosts,
  deleteCollection,
} from "../controllers/savedCollectionController.js";

const router = express.Router();

router.post("/", protect, createCollection);
router.get("/", protect, getMyCollections);

router.post("/:collectionId/post/:postId", protect, addPostToCollection);
router.delete("/:collectionId/post/:postId", protect, removePostFromCollection);

router.get("/:id", protect, getCollectionPosts);
router.delete("/:id", protect, deleteCollection);

export default router;
