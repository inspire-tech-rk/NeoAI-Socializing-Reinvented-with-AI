import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    type: {
      type: String,
      enum: ["post", "reel"],
      required: true,
    },

    media: String,
    caption: String,

    // 🔥 ML CORE
    embedding: [{ type: Number }],
    categories: [{ type: String }],
    music: String,

    // 🔥 ENGAGEMENT
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },

    duration: Number,
  },
  { timestamps: true }
);

contentSchema.index({ categories: 1 });
contentSchema.index({ createdAt: -1 });

export default mongoose.model("Content", contentSchema);
