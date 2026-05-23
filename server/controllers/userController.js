import User from "../models/Auth.js";
import fs from "fs";
import Notification from "../models/Notification.js";

// userController.js
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("followers", "username dp")
      .populate("following", "username dp");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const formatUser = (u) => ({
      ...u._doc,
     dp: u.dp || "",
    });

    user.followers = user.followers.map(formatUser);
    user.following = user.following.map(formatUser);

    res.json({
      ...user._doc,
     dp: user.dp || "",
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // from protect middleware
    const { username } = req.body;
    const dp = req.file; // multer file

    const updatedData = {};
    if (username) updatedData.username = username;
    if (dp) {
      updatedData.dp = dp.path;

      // Optionally: remove old dp file from uploads
      const oldUser = await User.findById(userId);
      if (oldUser.dp && fs.existsSync(oldUser.dp)) {
        fs.unlinkSync(oldUser.dp);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password");

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Fetch current user's following list
    const currentUser = await User.findById(currentUserId)
      .select("following")
      .populate("following", "_id username");

    const followingIds = (currentUser.following || []).map((u) =>
      u._id.toString(),
    );

    // Fetch users excluding self and already-followed users
    let users = await User.find({
      _id: { $nin: [currentUserId, ...followingIds] },
    })
      .select("username dp followers")
      .limit(10)
      .populate("followers", "_id username");

    // Prepare suggestion objects
    const suggestions = users.map((user) => {
      // Find mutual followers
      const mutualFollowers = user.followers.filter((follower) =>
        followingIds.includes(follower._id.toString()),
      );
      const mutualNames = mutualFollowers.map((f) => f.username);

      return {
        _id: user._id,
        username: user.username,
       dp: user.dp || "",

        isFollowing: false, // default, frontend will toggle
        mutualCount: mutualFollowers.length,
        mutualNames,
        reason:
          mutualNames.length > 0
            ? `Followed by ${mutualNames.join(", ")}`
            : "Suggested for you",
      };
    });

    // If no users, fallback to random users (like Instagram)
    if (suggestions.length === 0) {
      users = await User.find({ _id: { $ne: currentUserId } })
        .select("username dp")
        .limit(5);

      users.forEach((user) =>
        suggestions.push({
          _id: user._id,
          username: user.username,
          dp: user.dp ? `http://localhost:5000/${user.dp}` : "/default-dp.png",

          isFollowing: false,
          mutualCount: 0,
          mutualNames: [],
          reason: "Suggested for you",
        }),
      );
    }

    res.json(suggestions);
  } catch (err) {
    console.error("Suggestions error:", err);
    res.status(500).json({ message: "Failed to load suggestions" });
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ ENSURE ARRAYS EXIST (VERY IMPORTANT FIX)
    currentUser.following = currentUser.following || [];
    targetUser.followers = targetUser.followers || [];
    targetUser.following = targetUser.following || [];

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId,
    );

    if (isFollowing) {
      // ❌ UNFOLLOW
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // ✅ SAFE CHECKS
      const alreadyFollower = targetUser.followers.some(
        (id) => id.toString() === currentUserId.toString(),
      );

      const isFollowBack = targetUser.following.some(
        (id) => id.toString() === currentUserId.toString(),
      );

      // ✅ FOLLOW
      currentUser.following.addToSet(targetUserId);
      targetUser.followers.addToSet(currentUserId);

      // ✅ 1. NORMAL FOLLOW (VERY IMPORTANT 🔥)
      if (!alreadyFollower && !isFollowBack) {
        await Notification.findOneAndUpdate(
          {
            recipient: targetUserId,
            sender: currentUserId,
            type: "follow",
          },
          {
            recipient: targetUserId,
            sender: currentUserId,
            type: "follow",
            accepted: false,
          },
          { upsert: true, new: true },
        );
      }

      // ✅ 2. FOLLOW BACK (ACCEPT)
      if (isFollowBack) {
        // mark old request accepted
        await Notification.findOneAndUpdate(
          {
            recipient: currentUserId,
            sender: targetUserId,
            type: "follow",
          },
          { accepted: true },
        );

        // send accept notification
        await Notification.create({
          recipient: targetUserId,
          sender: currentUserId,
          type: "follow_accept",
        });
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ following: !isFollowing });
  } catch (err) {
    console.error("🔥 FOLLOW ERROR:", err); // 👈 CHECK THIS IN TERMINAL
    res.status(500).json({
      message: "Follow failed",
      error: err.message,
    });
  }
};

export const getChatUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "followers following",
      "_id username profilePicture",
    );

    const mutualUsers = user.following.filter((followed) =>
      user.followers.some(
        (follower) => follower._id.toString() === followed._id.toString(),
      ),
    );

    res.status(200).json(mutualUsers);
  } catch (err) {
    res.status(500).json(err);
  }
};
