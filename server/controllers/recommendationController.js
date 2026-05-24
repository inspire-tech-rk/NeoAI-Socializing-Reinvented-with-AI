import Interaction from "../models/Interaction.js";
import Post from "../models/Post.js";
import Content from "../models/Content.js";

/* ---------------- TRACK VIEW / WATCH / REWATCH ---------------- */
export const trackView = async (req, res) => {
  try {
    const { contentId, watchTime = 0 } = req.body;

    if (!contentId) {
      return res.json({ success: true });
    }

    let type = "view";
    if (watchTime >= 8) type = "watch";

    const repeatViews = watchTime >= 20 ? 1 : 0;

    await Interaction.create({
      user: req.user._id,
      content: contentId,
      type,
      watchTime,
      repeatViews,
    });

    await Content.findByIdAndUpdate(contentId, {
      $inc: {
        views: 1,
        watchTime,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Track view error:", err);
    res.status(500).json({ message: "Tracking failed" });
  }
};

/* ---------------- SMART RECOMMENDATIONS ---------------- */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    const interactions = await Interaction.find({ user: userId })
      .populate("content")
      .sort({ createdAt: -1 });

    const categoryScore = {};

    interactions.forEach((interaction) => {
      const categories = interaction.content?.categories || [];

      let weight = 0;

      if (interaction.type === "view") weight += 2;
      if (interaction.type === "watch") weight += 8;
      if (interaction.type === "like") weight += 15;
      if (interaction.type === "comment") weight += 20;

      if (interaction.watchTime >= 10) weight += 5;
      if (interaction.watchTime >= 20) weight += 10;
      if (interaction.watchTime >= 30) weight += 15;

      if (interaction.repeatViews > 0) weight += 18;

      categories.forEach((cat) => {
        const key = String(cat).toLowerCase().trim();
        categoryScore[key] = (categoryScore[key] || 0) + weight;
      });
    });

    let posts = await Post.find({ type: "video" })
      .populate("user", "username dp")
      .populate("likes", "_id username dp")
      .populate("reel")
      .populate("content");

    const hasHistory = Object.keys(categoryScore).length > 0;

    posts = posts.sort((a, b) => {
      if (!hasHistory) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      const aCategories = a.content?.categories || [];
      const bCategories = b.content?.categories || [];

      const aScore = aCategories.reduce((sum, cat) => {
        return sum + (categoryScore[String(cat).toLowerCase().trim()] || 0);
      }, 0);

      const bScore = bCategories.reduce((sum, cat) => {
        return sum + (categoryScore[String(cat).toLowerCase().trim()] || 0);
      }, 0);

      if (aScore !== bScore) return bScore - aScore;

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(posts);
  } catch (err) {
    console.error("Recommendation error:", err);

    const fallbackPosts = await Post.find({ type: "video" })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "username dp")
      .populate("likes", "_id username dp")
      .populate("reel")
      .populate("content");

    res.json(fallbackPosts);
  }
};