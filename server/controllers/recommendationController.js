import Interaction from "../models/Interaction.js";
import Post from "../models/Post.js";
import Content from "../models/Content.js"; // ✅ NEW
import axios from "axios";

/* ---------------- TRACK VIEW ---------------- */
export const trackView = async (req, res) => {
  try {
    const { postId, contentId, watchTime, scrollDepth } = req.body;

    // ✅ SUPPORT BOTH OLD + NEW SYSTEM
    const targetContentId = contentId || postId;

    await Interaction.create({
      user: req.user._id,
      content: targetContentId, // ✅ USE CONTENT
      type: watchTime > 5 ? "watch" : "view",
      watchTime: watchTime || 0,
      repeatViews: watchTime > 20 ? 1 : 0,
      scrollDepth: scrollDepth || 0,
    });

    // 🔥 UPDATE CONTENT STATS (if exists)
    if (contentId) {
      await Content.findByIdAndUpdate(contentId, {
        $inc: {
          views: 1,
          watchTime: watchTime || 0,
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Tracking failed" });
  }
};

/* ---------------- GET RECOMMENDATIONS ---------------- */
/* ---------------- GET RECOMMENDATIONS ---------------- */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    /* ---------------- FETCH INTERACTIONS ---------------- */
    const interactionsRaw = await Interaction.find().lean();

    const interactions = interactionsRaw.map((i) => ({
      user: i.user?.toString(),
      content: i.content?.toString(), // ✅ correct
      type: i.type,
      watchTime: i.watchTime || 0,
      repeatViews: i.repeatViews || 0,
      createdAt: i.createdAt,
    }));

    /* ---------------- FETCH CONTENTS ---------------- */
    const contentsRaw = await Content.find().lean();

    const contents = contentsRaw.map((c) => ({
      _id: c._id.toString(),   // 🔥🔥🔥 FIXED (MOST IMPORTANT)
      type: c.type,
      embedding: c.embedding || [],
      categories: c.categories || [],
      music: c.music || "",
      views: c.views || 0,
      watchTime: c.watchTime || 0,
      likes: c.likes || [],
      createdAt: c.createdAt,
    }));

    /* ---------------- CALL PYTHON ---------------- */
    const response = await axios.post("http://127.0.0.1:8000/recommend", {
      userId,
      interactions,
      contents,
    });

    const orderedContentIds = response.data.recommended;

    /* ---------------- FALLBACK ---------------- */
    if (!orderedContentIds || orderedContentIds.length === 0) {
      const fallbackPosts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("user", "username dp");

      return res.json(fallbackPosts);
    }

    /* ---------------- MAP CONTENT → POSTS ---------------- */
    const posts = await Post.find({
      content: { $in: orderedContentIds },
    })
      .populate("user", "username dp")
      .populate("content");

    /* ---------------- KEEP ORDER ---------------- */
    const orderedPosts = orderedContentIds
      .map((cid) =>
        posts.find((p) => p.content?._id.toString() === cid)
      )
      .filter(Boolean);

    res.json(orderedPosts);

  } catch (err) {
    console.error("🔥 RECOMMENDATION ERROR:", err.message);

    /* ---------------- SAFE FALLBACK ---------------- */
    const fallbackPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "username dp");

    res.json(fallbackPosts);
  }
};

