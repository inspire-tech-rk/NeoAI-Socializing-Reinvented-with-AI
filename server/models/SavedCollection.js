import mongoose from "mongoose";

const savedCollectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "FeedPost" }],
  },
  { timestamps: true }
);

export default mongoose.models.SavedCollection || mongoose.model("SavedCollection", savedCollectionSchema);
