import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    content: { type: mongoose.Schema.Types.ObjectId, ref: "Content" },

    type: {
      type: String,
      enum: ["like", "comment", "view", "watch", "share"],
    },

    watchTime: Number,
    repeatViews: Number,
  },
  { timestamps: true }
);


export default mongoose.model("Interaction", interactionSchema);
