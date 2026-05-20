import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const notifications = await Notification.find({
      recipient: currentUserId,
    })
      .populate("sender", "username dp")
      .populate("post", "file image")
      .populate("reel", "media thumbnail")
      .sort({ createdAt: -1 });

    const formatted = notifications.map((n) => ({
      ...n._doc,
      accepted: n.accepted || false,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Get Notifications Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};




export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read = true;

    // ✅ ONLY for follow
    if (notification.type === "follow") {
      notification.accepted = true;
    }

    await notification.save();

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};

