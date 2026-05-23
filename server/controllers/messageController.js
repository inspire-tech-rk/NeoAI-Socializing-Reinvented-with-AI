import Message from "../models/Message.js";
import User from "../models/Auth.js";

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
      // Cloudinary URL
      media = req.file.path;

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
      "username dp"
    );

    res.status(201).json(populated);
  } catch (err) {
    console.error("SendMessage ERROR:", err);
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
      .populate("sender receiver", "username dp");

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

/* GET MUTUAL FOLLOWERS */
export const getMutualUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingUsers = await User.find({
      _id: { $in: currentUser.following },
    });

    const mutualUsers = followingUsers.filter((user) =>
      user.followers.includes(currentUser._id)
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

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only delete message from MongoDB.
    // Media file remains in Cloudinary.
    await Message.findByIdAndDelete(messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Delete Message Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* MARK MESSAGES AS SEEN */
export const markAsSeen = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user._id,
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