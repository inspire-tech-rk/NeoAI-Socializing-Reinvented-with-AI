import axios from "axios";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import Notification from "../models/Notification.js";
import Interaction from "../models/Interaction.js";
import Content from "../models/Content.js"; // ✅ ADD
import { processCaption } from "../utils/aiProcessor.js"; // ✅ ADD

/* -------------------- CREATE POST (UPGRADED) -------------------- */
export const createPost = async (req, res) => {
  try {
    const isVideo = req.file.mimetype.startsWith("video");
   const filePath = req.file.path;
    const caption = req.body.caption || "";

    /* ------------------------------------------
       🔥 1. AI PROCESSING (NEW)
    ------------------------------------------ */
   const aiResult = await processCaption(caption) || {};

const embedding = aiResult.embedding || [];
const categories = aiResult.categories || [caption.toLowerCase()];


    /* ------------------------------------------
       🔥 2. CREATE CONTENT (ML CORE)
    ------------------------------------------ */
    const content = await Content.create({
      user: req.user._id,
      type: isVideo ? "reel" : "post", // ✅ important
      media: filePath,
      caption,
      embedding,
      categories,
    });

    /* ------------------------------------------
       ✅ 3. CREATE POST (OLD SYSTEM SAFE)
    ------------------------------------------ */
    const post = await Post.create({
      user: req.user._id,
      caption,
      file: filePath,
      type: isVideo ? "video" : "image",

      // 🔥 NEW LINK
      content: content._id,
    });

    /* ------------------------------------------
       🔥 4. RESPONSE (WITH CONTENT)
    ------------------------------------------ */
    const populatedPost = await Post.findById(post._id)
      .populate("user", "username dp")
      .populate("reel")
      .populate("content"); // ✅ IMPORTANT

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "Post creation failed" });
  }
};

/* -------------------- DELETE POST -------------------- */
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* -------------------- GET MY POSTS -------------------- */
export const myPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.user._id,
      user: { $ne: null },
    })
      .sort({ createdAt: -1 })
      .populate("user", "username dp")
      .populate({
        path: "reel",
        populate: { path: "likes" },
      })
      .populate("likes", "_id username dp");

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

/* -------------------- GET USER POSTS -------------------- */
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .populate("user", "username dp")
      .populate({
        path: "reel",
        populate: { path: "likes" },
      })
      .populate("likes", "_id username dp");

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -------------------- GLOBAL FEED (FIXED) -------------------- */
export const getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "username dp")
      .populate("likes", "_id username dp")
      .populate({
        path: "reel",
        populate: { path: "likes user" },
      });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Feed failed" });
  }
};

export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id || req.user._id;

    const isLiked = post.likes.some(
      (id) => id.toString() === userId.toString(),
    );

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);

      // 🔥 ML DATA TRACKING (VERY IMPORTANT)
      await Interaction.create({
        user: userId,
        content: post.content, // 🔥 FIXED
        type: "like",
      });

      // 🔔 NOTIFICATION
      if (post.user.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.user,
          sender: userId,
          type: "like",
          post: post._id,
        });
      }
    }

    await post.save();

    const updatedPost = await Post.findById(post._id).populate(
      "likes",
      "_id username dp",
    );

    res.json({
      likesCount: updatedPost.likes.length,
      liked: !isLiked,
      likes: updatedPost.likes,
    });
  } catch (err) {
    res.status(500).json({ message: "Like toggle failed" });
  }
};

export const getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "username dp")
      .populate("likes", "_id username dp");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch post" });
  }
};
