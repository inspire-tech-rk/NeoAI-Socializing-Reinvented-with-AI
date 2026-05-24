import mongoose from "mongoose";

const storyCommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const storySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    file: String,
    type: String,
    expiresAt: Date,

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [storyCommentSchema],
  },
  { timestamps: true },
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Story || mongoose.model("Story", storySchema);
