import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";

// Routes
import authRoutes from "./routes/authRoute.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoute.js";
import highlightRoutes from "./routes/highlightRoutes.js";
import storyRoutes from "./routes/storyRoute.js";
import savedCollectionRoutes from "./routes/savedCollectionRoute.js";
import nexaiRoutes from "./routes/nexaiRoute.js";
import messageRoute from "./routes/messageRoute.js";
import reelRoute from "./routes/reelRoute.js";
import commentRoutes from "./routes/commentRoute.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import recommendationRoutes from "./routes/recommendationRoute.js";

dotenv.config({
  path: "./.env",
});

const app = express();

const PORT = process.env.PORT || 5000;

/* -------------------- CORS CONFIG -------------------- */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use(cookieParser());

/* -------------------- HEALTH CHECK -------------------- */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
  });
});

/* -------------------- UPLOADS -------------------- */

app.use("/uploads", (req, res, next) => {
  res.setHeader("Accept-Ranges", "bytes");

  res.setHeader("Cache-Control", "public, max-age=3600");

  next();
});

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.set("Accept-Ranges", "bytes");
    },
  }),
);

/* -------------------- ROUTES -------------------- */

app.use("/api/auth", authRoutes);

app.use("/api/posts", postRoutes);

app.use("/api/users", userRoutes);

app.use("/api/highlights", highlightRoutes);

app.use("/api/stories", storyRoutes);

app.use("/api/collections", savedCollectionRoutes);

app.use("/api/nexai", nexaiRoutes);

app.use("/api/messages", messageRoute);

app.use("/api/reels", reelRoute);

app.use("/api/comments", commentRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/recommendations", recommendationRoutes);

/* -------------------- ROOT ROUTE -------------------- */

app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

/* -------------------- DATABASE & SERVER -------------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");

    app.listen(PORT, () => {
      console.log(`Server running on Port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed ❌", err);
  });