import Message from "../models/Message.js";
import User from "../models/Auth.js";
import fs from "fs";
import path from "path";

/* SEND MESSAGE */
export const sendMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body;

    if (!receiver) {
      return res.status(400).json({ message: "Receiver is required" });
    }

    let media = null;
    let messageType = "text";

    if (req.file) {
      media = req.file.filename;

      const mime = req.file.mimetype || "";

      if (mime.startsWith("image/")) {
        messageType = "image";
      } else if (mime.startsWith("video/")) {
        messageType = "video";
      } else {
        messageType = "file";
      }
    }

    const message = new Message({
      sender: req.user._id,
      receiver,
      text: text || "",
      media,
      messageType,
    });

    await message.save();

    const populated = await Message.findById(message._id).populate(
      "sender receiver",
      "username profilePicture"
    );

    res.status(201).json(populated);
  } catch (err) {
    console.error("SendMessage ERROR:", err);  // ✅ important
    res.status(500).json({ message: "Server error" });
  }
};


/* GET CONVERSATION */
export const getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender receiver", "username profilePicture");

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ✅ GET MUTUAL FOLLOWERS
export const getMutualUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find users I follow
    const followingUsers = await User.find({
      _id: { $in: currentUser.following },
    });

    // Filter only those who follow me back
    const mutualUsers = followingUsers.filter((user) =>
      user.followers.includes(currentUser._id),
    );

    res.status(200).json(mutualUsers);
  } catch (error) {
    console.error("Mutual fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* DELETE MESSAGE */
export const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // only sender can delete
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // delete media file if exists
    if (message.media) {
      const filePath = path.join("uploads", message.media);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Delete Message Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// MARK MESSAGES AS SEEN
export const markAsSeen = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      {
        sender: userId,          // messages from other user
        receiver: req.user._id,  // to current user
        status: { $ne: "seen" },
      },
      {
        $set: {
          status: "seen",
          seenAt: new Date(),
        },
      }
    );

    res.json({ message: "Messages marked as seen" });
  } catch (err) {
    console.error("Seen error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

