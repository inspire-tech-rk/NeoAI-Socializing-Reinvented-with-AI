import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";
import { createReel, getReels,toggleLikeReel,trackReelView } from "../controllers/reelController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    const cleanName = Date.now() + "-" + file.originalname.replace(/[^\w.-]/g, "");
    cb(null, cleanName);
  }
});

const upload = multer({ storage });

router.post("/", protect, upload.single("media"), createReel);
router.get("/", getReels);
router.post("/:id/like", protect, toggleLikeReel);
router.post("/track", trackReelView);



export default router;
