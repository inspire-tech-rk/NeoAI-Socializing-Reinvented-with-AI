import mongoose from "mongoose";

const highlightItemSchema = new mongoose.Schema(
  {
    file: String, // image/video path
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const highlightSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    cover: String, // circle thumbnail
    items: [highlightItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Highlight", highlightSchema);
