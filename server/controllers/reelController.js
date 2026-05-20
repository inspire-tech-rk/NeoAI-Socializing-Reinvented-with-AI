import Reel from "../models/Reel.js";
import Post from "../models/Post.js";
import Content from "../models/Content.js";
import Interaction from "../models/Interaction.js";
import Notification from "../models/Notification.js";

import { processCaption } from "../utils/aiProcessor.js";

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath);

/* ======================================================
   🎥 CREATE REEL
====================================================== */
export const createReel = async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputName = `reel-${Date.now()}.mp4`;
    const outputPath = path.join("uploads", outputName);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-c:v libx264",
          "-preset fast",
          "-pix_fmt yuv420p",
          "-movflags +faststart",
          "-profile:v baseline",
          "-level 3.0",
        ])
        .save(outputPath)
        .on("end", resolve)
        .on("error", reject);
    });

    fs.unlinkSync(inputPath);

    const mediaPath = `/uploads/${outputName}`;
    const caption = req.body.caption || "";

    const { embedding, categories } = await processCaption(caption);

    const content = await Content.create({
      user: req.user.id,
      type: "reel",
      media: mediaPath,
      caption,
      embedding,
      categories,
      duration: 30,
    });

    const reel = await Reel.create({
      user: req.user.id,
      media: mediaPath,
      type: "video",
      caption,
      content: content._id,
    });

    const post = await Post.create({
      user: req.user.id,
      caption,
      file: mediaPath,
      type: "video",
      reel: reel._id,
      content: content._id,
    });

    res.status(201).json({
      reel,
      postId: post._id,
      contentId: content._id,
    });
  } catch (err) {
    console.error("Create reel error:", err);
    res.status(500).json({ message: "Reel conversion failed" });
  }
};

/* ======================================================
   🎬 GET REELS (FINAL FIXED)
====================================================== */
export const getReels = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🔥 1. INTERACTIONS
    const interactions = await Interaction.find({
      user: userId,
      type: { $in: ["watch", "like", "view", "comment"] },
    }).populate("content");

    // 🔥 2. CATEGORY SCORE
    const categoryScore = {};
    interactions.forEach((item) => {
      const categories = item.content?.categories || [];

      let weight = 0;

      if (item.type === "view") weight = 2;
      if (item.type === "watch") weight = 5;
      if (item.type === "comment") weight = 6; // 🔥 NEW
      if (item.type === "like") weight = 8;

      categories.forEach((cat) => {
        categoryScore[cat] = (categoryScore[cat] || 0) + weight;
      });
    });

    // 🔥 3. FETCH POSTS
    let posts = await Post.find({ type: "video" })
      .populate("user", "username dp")
      .populate("likes", "_id username dp")
      .populate("reel")
      .populate("content");

    // 🔥 4. SEEN CONTENT
    const seenContentIds = interactions.map((i) => i.content?._id?.toString());

    // 🔥 5. FINAL SMART SORT
    const hasHistory = interactions.length > 0;

    posts = posts.sort((a, b) => {
      const aSeen = seenContentIds.includes(a.content?._id?.toString());
      const bSeen = seenContentIds.includes(b.content?._id?.toString());

      const aScore =
        a.content?.categories?.reduce(
          (sum, cat) => sum + (categoryScore[cat] || 0),
          0,
        ) || 0;

      const bScore =
        b.content?.categories?.reduce(
          (sum, cat) => sum + (categoryScore[cat] || 0),
          0,
        ) || 0;

      // ✅ COLD START
      if (!hasHistory) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      // ✅ SOFT PENALTY
      const aFinal = aSeen ? aScore * 0.7 : aScore;
      const bFinal = bSeen ? bScore * 0.7 : bScore;

      if (aFinal !== bFinal) return bFinal - aFinal;

      // ✅ FALLBACK
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(posts);
  } catch (error) {
    console.error("Get reels error:", error);
    res.status(500).json({ message: "Failed to fetch reels" });
  }
};

/* ======================================================
   ❤️ LIKE REEL
====================================================== */
export const toggleLikeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    const post = await Post.findOne({ reel: reel._id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id || req.user._id;

    const isLiked = post.likes.some(
      (id) => id.toString() === userId.toString(),
    );

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);

      // 🔥 INTERACTION
      await Interaction.create({
        user: userId,
        content: post.content,
        type: "like",
      });

      // 🔥 BOOST CONTENT SIGNAL
      await Content.findByIdAndUpdate(post.content, {
        $inc: { likesCount: 1 },
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
      post: updatedPost,
    });
  } catch (err) {
    res.status(500).json({ message: "Like toggle failed" });
  }
};

/* ======================================================
   📊 TRACK VIEW (FINAL FIXED)
====================================================== */
export const trackReelView = async (req, res) => {
  try {
    const { contentId, watchTime } = req.body;

    if (!contentId) return res.json({ success: true });

    // 🔥 ALLOW STRONG REPEAT SIGNALS
    const alreadyInteracted = await Interaction.findOne({
      user: req.user._id,
      content: contentId,
      type: { $in: ["watch", "view"] },
    });

    // 🔥 RELAXED (IMPORTANT)
    if (alreadyInteracted && watchTime < 5) {
      return res.json({ success: true });
    }

    // 🔥 SESSION BLOCK
    const existing = await Interaction.findOne({
      user: req.user._id,
      content: contentId,
      type: { $in: ["view", "watch"] },
      createdAt: { $gte: new Date(Date.now() - 120000) },
    });

    if (existing) return res.json({ success: true });

    // 🔥 TYPE LOGIC
    let type;
    if (watchTime > 15)
      type = "watch"; // 🔥 easier to trigger
    else if (watchTime > 3) type = "view";
    else return res.json({ success: true });

    // 🔥 STORE
    // 🔥 STORE INTERACTION
    await Interaction.create({
      user: req.user._id,
      content: contentId,
      type,
      watchTime,
      completionRate: watchTime / 30, // 🔥 NEW
      repeatViews: watchTime > 20 ? 1 : 0,
    });

    // 🔥 UPDATE CONTENT
    await Content.findByIdAndUpdate(contentId, {
      $inc: {
        views: 1,
        watchTime: watchTime,
        engagementScore: watchTime > 20 ? 2 : 1, // 🔥 NEW
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Track view error:", err);
    res.status(500).json({ message: "Tracking failed" });
  }
};
