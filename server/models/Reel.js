import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // 🔥 KEEP FOR EXISTING SYSTEM (can remove later)
    media: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    caption: { type: String },

    // 🔥 NEW (MAIN ML LINK)
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
    },

    // 🔥 KEEP (optional – but ideally remove later)
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// 🔥 OPTIONAL INDEX
reelSchema.index({ content: 1 });

export default mongoose.model("Reel", reelSchema);
