import express from "express";
import {
  register,
  login,
  logout,
  me,
} from "../controllers/authController.js";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ REGISTER → needs multer
router.post("/register", upload.single("dp"), register);

// ❌ LOGIN → NO multer here
router.post("/login", login);

// LOGOUT
router.post("/logout", protect, logout);

// CURRENT USER
router.get("/me", protect, me);

export default router;
