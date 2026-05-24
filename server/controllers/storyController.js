import Story from "../models/Story.js";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

// Upload
export const uploadStory = async (req, res) => {
  const stories = req.files.map((file) => ({
    user: req.user._id,
    file: file.path,
    type: file.mimetype.startsWith("video") ? "video" : "image",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }));

  await Story.insertMany(stories);
  res.json({ success: true });
};

// ✅ STORIES FOR FEED (GROUPED BY USER)
export const getFeedStories = async (req, res) => {
  try {
    const stories = await Story.aggregate([
      { $match: { expiresAt: { $gt: new Date() } } },
      {
        $group: {
          _id: "$user",
          stories: {
            $push: {
              _id: "$_id",
              file: "$file",
              type: "$type",
              createdAt: "$createdAt",
              user: "$user",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $sort: { "stories.createdAt": 1 } },
    ]);

    res.json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load feed stories" });
  }
};

// ✅ STORIES OF A SINGLE USER
export const getStoriesByUser = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  const stories = await Story.find({
    user: userId,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: 1 });

  res.json(stories);
};

// Has story
export const hasStory = async (req, res) => {
  const exists = await Story.exists({
    user: req.params.userId,
    expiresAt: { $gt: new Date() },
  });
  res.json({ hasStory: !!exists });
};

// Delete
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) return res.status(404).json({ message: "Story not found" });

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await story.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

export const toggleStoryLike = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) return res.status(404).json({ message: "Story not found" });

    const userId = req.user._id;
    const alreadyLiked = story.likes.some(
      (id) => id.toString() === userId.toString(),
    );

    if (alreadyLiked) {
      story.likes.pull(userId);
    } else {
      story.likes.addToSet(userId);

      if (story.user.toString() !== userId.toString()) {
        await Notification.create({
          recipient: story.user,
          sender: userId,
          type: "story_like",
          story: story._id,
        });
      }
    }

    await story.save();

    res.json({
      liked: !alreadyLiked,
      likesCount: story.likes.length,
    });
  } catch (err) {
    console.error("Story like error:", err);
    res.status(500).json({ message: "Story like failed" });
  }
};

export const commentOnStory = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment required" });
    }

    const story = await Story.findById(req.params.id);

    if (!story) return res.status(404).json({ message: "Story not found" });

    story.comments.push({
      user: req.user._id,
      text,
    });

    await story.save();

    if (story.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: story.user,
        sender: req.user._id,
        type: "story_comment",
        story: story._id,
        commentText: text,
      });
    }

    res.json({
      success: true,
      comments: story.comments,
    });
  } catch (err) {
    console.error("Story comment error:", err);
    res.status(500).json({ message: "Story comment failed" });
  }
};
