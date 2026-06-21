import User from "../models/Auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    await User.create({
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

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
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

/* -------------------- GOOGLE LOGIN -------------------- */

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let user = await User.findOne({ email });

    if (!user) {
      const username =
        name?.replace(/\s+/g, "_").replace(/[^\w]/g, "").toLowerCase() ||
        email.split("@")[0];

      user = await User.create({
        username,
        email,
        password: "GOOGLE_AUTH_USER",
        dp: picture || "",
        googleId: payload.sub,
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Google login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        dp: user.dp,
      },
    });
  } catch (err) {
    console.error("Google Login Error:", err);

    res.status(500).json({
      message: "Google login failed",
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

/* -------------------- SWITCH ACCOUNT -------------------- */

export const switchAccount = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Switched successfully",
      token,
      user,
    });
  } catch (err) {
    console.error("Switch account error:", err);

    res.status(500).json({
      message: "Switch account failed",
    });
  }
};

export const checkUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Check user failed" });
  }
};