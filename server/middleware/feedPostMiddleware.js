import mongoose from "mongoose";

export const validateFeedPostId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }
  next();
};
