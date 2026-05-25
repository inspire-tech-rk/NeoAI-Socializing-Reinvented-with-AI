import User from "../models/Auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* -------------------- REGISTER -------------------- */

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      dp: req.file ? req.file.path : "",
    });

    res.status(201).json({
      message: "Registered successfully",
    });
  } catch (err) {
    console.error("Register Error:", err);

    res.status(500).json({
      message: "Registration failed",
    });
  }
};

/* -------------------- LOGIN -------------------- */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Save token in secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        dp: user.dp,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);

    res.status(500).json({
      message: "Login failed",
    });
  }
};

/* -------------------- CURRENT USER -------------------- */

export const me = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.error("Me Error:", err);

    res.status(500).json({
      message: "Failed to get user",
    });
  }
};

/* -------------------- LOGOUT -------------------- */

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout Error:", err);

    res.status(500).json({
      message: "Logout failed",
    });
  }
};

export const switchAccount = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Switched successfully",
      user,
    });
  } catch (err) {
    console.error("Switch account error:", err);
    res.status(500).json({ message: "Switch account failed" });
  }
};