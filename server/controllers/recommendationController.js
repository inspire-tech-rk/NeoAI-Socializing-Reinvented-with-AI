import Interaction from "../models/Interaction.js";
import Post from "../models/Post.js";
import Content from "../models/Content.js";

/* ---------------- TRACK VIEW / WATCH / REWATCH ---------------- */
export const trackView = async (req, res) => {
  try {
    const { contentId, watchTime = 0 } = req.body;

    if (!contentId) return res.json({ success: true });

    // fast scroll should not affect recommendation
    if (watchTime < 3) return res.json({ success: true });

    let type = "view";
    if (watchTime >= 8) type = "watch";

    await Interaction.create({
      user: req.user._id,
      content: contentId,
      type,
      watchTime,
      repeatViews: watchTime >= 20 ? 1 : 0,
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

/* ---------------- WEIGHT-BASED RECOMMENDATIONS ---------------- */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    const interactions = await Interaction.find({ user: userId })
      .populate("content")
      .sort({ createdAt: -1 });

    const exactContentScore = {};
    const categoryScore = {};

    interactions.forEach((interaction, index) => {
      const contentId = interaction.content?._id?.toString();
      const categories = interaction.content?.categories || [];

      if (!contentId) return;

      let weight = 0;

      // operation weights
      if (interaction.type === "view") weight += 3;
      if (interaction.type === "watch") weight += 10;
      if (interaction.type === "like") weight += 40;
      if (interaction.type === "comment") weight += 50;

      // watch time weights
      if (interaction.watchTime >= 8) weight += 8;
      if (interaction.watchTime >= 15) weight += 15;
      if (interaction.watchTime >= 25) weight += 25;

      // rewatch weight
      if (interaction.repeatViews > 0) weight += 35;

      // latest interaction should be strongest
      const recencyBoost = Math.max(1, 30 - index * 2);
      weight += recencyBoost;

      // exact interacted video boost
      exactContentScore[contentId] =
        (exactContentScore[contentId] || 0) + weight * 2;

      // same category/caption boost
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

    posts = posts.sort((a, b) => {
      const aContentId = a.content?._id?.toString();
      const bContentId = b.content?._id?.toString();

      const aCategories = a.content?.categories || [];
      const bCategories = b.content?.categories || [];

      const aExact = exactContentScore[aContentId] || 0;
      const bExact = exactContentScore[bContentId] || 0;

      const aCategory = aCategories.reduce(
        (sum, cat) =>
          sum + (categoryScore[String(cat).toLowerCase().trim()] || 0),
        0
      );

      const bCategory = bCategories.reduce(
        (sum, cat) =>
          sum + (categoryScore[String(cat).toLowerCase().trim()] || 0),
        0
      );

      // final score
      const aFinal = aExact + aCategory;
      const bFinal = bExact + bCategory;

      if (aFinal !== bFinal) return bFinal - aFinal;

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