import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  targetType: {
    type: String,
    required: true,
    enum: ["post", "reel", "story", "highlight"]
  },

  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  }

}, { timestamps: true });

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);
