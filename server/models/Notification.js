import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "follow_accept"],

      required: true,
      lowercase: true,
      trim: true,
    },

    // ✅ NEW FIELD (COMMENT PREVIEW)
    commentText: {
      type: String,
      trim: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reel",
    },
    read: {
      type: Boolean,
      default: false,
    },

    accepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Extra safety
notificationSchema.pre("save", function (next) {
  if (this.type) {
    this.type = this.type.toLowerCase();
  }
  next();
});

export default mongoose.model("Notification", notificationSchema);
