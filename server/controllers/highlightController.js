import Highlight from "../models/Highlight.js";
import fs from "fs";

/* -------------------- CREATE HIGHLIGHT -------------------- */
export const createHighlight = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !req.files?.length) {
      return res.status(400).json({ message: "Title & media required" });
    }

    const items = req.files.map((file) => ({ file: file.path }));

    const highlight = await Highlight.create({
      user: req.user._id,
      title,
      cover: items[0].file, // first item as cover
      items,
    });

    res.status(201).json(highlight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Highlight creation failed" });
  }
};

/* -------------------- GET USER HIGHLIGHTS -------------------- */
export const getUserHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ user: req.params.userId }).sort({
      createdAt: 1,
    });
    res.json(highlights);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch highlights" });
  }
};

/* -------------------- DELETE ENTIRE HIGHLIGHT -------------------- */
export const deleteHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) {
      return res.status(404).json({ message: "Highlight not found" });
    }

    if (highlight.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // delete files
    highlight.items.forEach((item) => {
      if (fs.existsSync(item.file)) fs.unlinkSync(item.file);
    });

    await highlight.deleteOne();

    res.json({ message: "Highlight deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};


/* -------------------- ADD STORY TO HIGHLIGHT -------------------- */
export const addStoryToHighlight = async (req, res) => {
  try {
    const { storyId } = req.body;

    const Story = (await import("../models/Story.js")).default;

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let highlight = await Highlight.findOne({
      user: req.user._id,
      title: "Stories",
    });

    if (!highlight) {
      highlight = await Highlight.create({
        user: req.user._id,
        title: "Stories",
        cover: story.file,
        items: [{ file: story.file }],
      });
    } else {
      const alreadyAdded = highlight.items.some(
        (item) => item.file === story.file
      );

      if (!alreadyAdded) {
        highlight.items.push({ file: story.file });

        if (!highlight.cover) {
          highlight.cover = story.file;
        }

        await highlight.save();
      }
    }

    res.json({
      success: true,
      highlight,
    });
  } catch (err) {
    console.error("Add story to highlight error:", err);
    res.status(500).json({ message: "Failed to add story to highlight" });
  }
};