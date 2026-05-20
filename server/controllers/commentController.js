import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import Interaction from "../models/Interaction.js";




// CREATE COMMENT
export const createComment = async (req, res) => {
  try {
    const { text, targetId } = req.body;

    if (!text || !targetId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const comment = await Comment.create({
      text,
      targetType: "post",
      targetId,
      user: req.user._id,
    });

    // 🔍 get post first (IMPORTANT)
    const post = await Post.findById(targetId);

    // 🔥 ML DATA TRACKING (FIXED)
    if (post && post.content) {
  await Interaction.create({
    user: req.user._id,
    content: post.content,
    type: "comment",
  });
}


    const populated = await comment.populate("user", "username dp");

    /* ---------------- NOTIFICATION ---------------- */

    let ownerId = post?.user;

    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: ownerId,
        sender: req.user._id,
        type: "comment",
        post: targetId,
        commentText: text,
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create Comment Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};





// GET COMMENTS BY TARGET
export const getComments = async (req, res) => {
  try {
    const { targetId } = req.params;

    if (!targetId || targetId === "undefined") {
      return res.status(400).json({ message: "Invalid targetId" });
    }

    const comments = await Comment.find({ targetId })
      .populate("user", "username dp");

    res.json(comments);
  } catch (err) {
    console.error("Fetch Comments Error:", err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};


// DELETE COMMENT
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    await comment.deleteOne();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("Delete Comment Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE COMMENT
export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.text = req.body.text;

    await comment.save();

    const updatedComment = await Comment.findById(comment._id).populate(
      "user",
      "username dp",
    );

    res.json(updatedComment);
  } catch (err) {
    console.error("Update Comment Error:", err);
    res.status(500).json({ message: err.message });
  }
};
