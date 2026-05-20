import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    dp: { type: String, default: "" },

    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeedPost",
      },
    ],

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],


  },
  { timestamps: true }
);


export default mongoose.models.User || mongoose.model("User", userSchema);
