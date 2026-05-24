import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: String,
    content: String,
    type: String,
  },
  { _id: false }
);

const nexAIChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      default: "New Chat",
    },

    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("NexAIChat", nexAIChatSchema);