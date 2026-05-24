import NexAIChat from "../models/NexAIChat.js";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import NodeCache from "node-cache";
import dotenv from "dotenv";

dotenv.config();

// =========================
// ✅ GEMINI CLIENT
// =========================
const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =========================
// ✅ CACHE (10 MIN)
// =========================
const cache = new NodeCache({
  stdTTL: 600,
});

// =========================
// ✅ MAIN CONTROLLER
// =========================
export const askNexAI = async (req, res) => {
  try {
    // ✅ Get question + history + userId
    const { question, history, userId } = req.body;

    // =========================
    // ✅ VALIDATION
    // =========================
    if (!question) {
      return res.status(400).json({
        message: "Question is required",
      });
    }

    // =========================
    // ✅ FIND OLD CHAT
    // =========================
    let chat = await NexAIChat.findOne({
      userId,
    });

    // =========================
    // ✅ CREATE CHAT IF NOT EXISTS
    // =========================
    if (!chat) {
      chat = new NexAIChat({
        userId,
        messages: [],
      });
    }

    // =========================
    // ✅ CONVERSATION MEMORY
    // =========================
    const conversation = [
      ...(history || []).map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",

        content: msg.content,
      })),

      {
        role: "user",
        content: question,
      },
    ];

    // =========================
    // ✅ CACHE CHECK
    // =========================
    const cached = cache.get(question);

    if (cached) {
      return res.json({
        answer: cached + " (cached)",
      });
    }

    // ==================================================
    // 🔵 1. OPENROUTER (PRIMARY)
    // ==================================================
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct:free",

          messages: conversation,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "NexAI",
          },
        },
      );

      const text = response.data.choices[0].message.content;

      // ✅ Save cache
      cache.set(question, text);

      // ✅ SAVE CHAT IN DATABASE
      chat.messages.push(
        {
          role: "user",
          content: question,
        },
        {
          role: "assistant",
          content: text,
          type: "normal",
        },
      );

      await chat.save();

      console.log("✅ Answer from OpenRouter");

      return res.json({
        answer: text,
      });
   } catch (err) {
  console.error("OpenRouter failed:", err.response?.data || err.message);
}

    // ==================================================
    // 🟣 2. GROQ (BACKUP)
    // ==================================================
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",

          messages: conversation,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      const text = response.data.choices[0].message.content;

      // ✅ Save cache
      cache.set(question, text);

      // ✅ SAVE CHAT IN DATABASE
      chat.messages.push(
        {
          role: "user",
          content: question,
        },
        {
          role: "assistant",
          content: text,
          type: "normal",
        },
      );

      await chat.save();

      console.log("✅ Answer from Groq");

      return res.json({
        answer: text,
      });
   } catch (err) {
  console.error("Groq failed:", err.response?.data || err.message);
}

    // ==================================================
    // 🟢 3. GEMINI (LAST FALLBACK)
    // ==================================================
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",

        contents: conversation.map((msg) => ({
          role: msg.role,
          parts: [
            {
              text: msg.content,
            },
          ],
        })),
      });

      const text = response.text;

      // ✅ Save cache
      cache.set(question, text);

      // ✅ SAVE CHAT IN DATABASE
      chat.messages.push(
        {
          role: "user",
          content: question,
        },
        {
          role: "assistant",
          content: text,
          type: "normal",
        },
      );

      await chat.save();

      console.log("✅ Answer from Gemini");

      return res.json({
        answer: text,
      });
    } catch (err) {
  console.error("Gemini failed:", err.response?.data || err.message);
}

    // ==================================================
    // 🔴 CACHE FALLBACK
    // ==================================================
    const fallback = cache.get(question);

    if (fallback) {
      return res.json({
        answer: fallback + " (old cached)",
      });
    }

    // ==================================================
    // ❌ FINAL FAILURE
    // ==================================================
    return res.status(500).json({
      message: "⚠️ All AI services failed. Try again later.",
    });
  } catch (err) {
    console.log("❌ Controller Error:", err);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// =========================
// ✅ GET OLD CHATS
// =========================
export const getNexAIChats = async (req, res) => {
  try {
    const { userId } = req.params;

    const chat = await NexAIChat.findOne({
      userId,
    });

    if (!chat) {
      return res.json([]);
    }

    res.json(chat.messages);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to load chats",
    });
  }
};

// =========================
// ✅ CLEAR CHATS
// =========================
export const clearNexAIChats = async (req, res) => {
  try {
    const { userId } = req.params;

    await NexAIChat.findOneAndDelete({
      userId,
    });

    res.json({
      message: "Chats cleared",
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to clear chats",
    });
  }
};
