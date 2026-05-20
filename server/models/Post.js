import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // 🔥 KEEP FOR BACKWARD COMPATIBILITY (optional, can remove later)
    caption: String,
    file: String,

    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },

    // 🔥 EXISTING RELATION (KEEP)
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reel",
    },

    // 🔥 NEW (MAIN ML LINK)
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
    },

    // 🔥 KEEP (SOURCE OF TRUTH FOR LIKES)
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// 🔥 INDEXES (KEEP)
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

// 🔥 OPTIONAL: FAST LOOKUP BY CONTENT
postSchema.index({ content: 1 });

export default mongoose.model("Post", postSchema);
