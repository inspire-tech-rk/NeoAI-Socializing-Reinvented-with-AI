import express from "express";
import {
  register,
  login,
  googleLogin,
  logout,
  me,
  switchAccount,
} from "../controllers/authController.js";

import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------- REGISTER -------------------- */
router.post("/register", upload.single("dp"), register);

/* -------------------- LOGIN -------------------- */
router.post("/login", login);

/* -------------------- GOOGLE LOGIN -------------------- */
router.post("/google", googleLogin);

/* -------------------- LOGOUT -------------------- */
router.post("/logout", protect, logout);

/* -------------------- SWITCH ACCOUNT -------------------- */
router.post("/switch", switchAccount);

/* -------------------- CURRENT USER -------------------- */
router.get("/me", protect, me);

export default router;