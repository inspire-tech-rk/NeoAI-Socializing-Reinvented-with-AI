import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    file: String,
    type: String, // image | video
    expiresAt: Date,
  },
  { timestamps: true }
);

// auto delete after 24h
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Story || mongoose.model("Story", storySchema);
