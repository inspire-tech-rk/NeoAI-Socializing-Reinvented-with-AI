import NexAIChat from "../models/NexAIChat.js";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import NodeCache from "node-cache";
import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   AI CLIENTS
========================================================= */

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const cache = new NodeCache({
  stdTTL: 600,
});

/* =========================================================
   HELPERS
========================================================= */

const getTitleFromQuestion = (question) => {
  if (!question) return "New Chat";

  return question.length > 35
    ? question.slice(0, 35) + "..."
    : question;
};

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Unknown error"
  );
};

/*
  Gemini accepts:
  user
  model

  Your frontend/database uses:
  user
  assistant

  So we normalize assistant -> model.
*/
const buildGeminiConversation = (history = [], question) => {
  const conversation = [];

  for (const msg of history) {
    if (!msg?.content) continue;

    conversation.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: String(msg.content),
        },
      ],
    });
  }

  if (question) {
    conversation.push({
      role: "user",
      parts: [
        {
          text: String(question),
        },
      ],
    });
  }

  return conversation;
};

/* =========================================================
   CREATE CHAT
========================================================= */

export const createNexAIChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const chat = await NexAIChat.create({
      userId,
      title: "New Chat",
      messages: [],
    });

    res.status(201).json(chat);
  } catch (err) {
    console.error("Create NexAI chat error:", err);

    res.status(500).json({
      message: "Failed to create chat",
    });
  }
};

/* =========================================================
   GET ALL CHATS
========================================================= */

export const getNexAIChats = async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await NexAIChat.find({ userId })
      .select("title pinned createdAt updatedAt messages")
      .sort({
        pinned: -1,
        updatedAt: -1,
      });

    res.json(chats);
  } catch (err) {
    console.error("Get NexAI chats error:", err);

    res.status(500).json({
      message: "Failed to load chats",
    });
  }
};

/* =========================================================
   GET SINGLE CHAT
========================================================= */

export const getSingleNexAIChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await NexAIChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    res.json(chat);
  } catch (err) {
    console.error("Get single NexAI chat error:", err);

    res.status(500).json({
      message: "Failed to load chat",
    });
  }
};

/* =========================================================
   DELETE CHAT
========================================================= */

export const deleteNexAIChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    await NexAIChat.findByIdAndDelete(chatId);

    res.json({
      message: "Chat deleted",
    });
  } catch (err) {
    console.error("Delete NexAI chat error:", err);

    res.status(500).json({
      message: "Failed to delete chat",
    });
  }
};

/* =========================================================
   CLEAR ALL CHATS
========================================================= */

export const clearNexAIChats = async (req, res) => {
  try {
    const { userId } = req.params;

    await NexAIChat.deleteMany({
      userId,
    });

    res.json({
      message: "All chats cleared",
    });
  } catch (err) {
    console.error("Clear NexAI chats error:", err);

    res.status(500).json({
      message: "Failed to clear chats",
    });
  }
};

/* =========================================================
   ASK NEXAI
========================================================= */

export const askNexAI = async (req, res) => {
  try {
    const {
      question,
      history = [],
      userId,
      chatId,
    } = req.body;

    const imageUrl = req.file?.path || "";

    /* ---------------------------------------------
       VALIDATION
    --------------------------------------------- */

    if (!question?.trim() && !imageUrl) {
      return res.status(400).json({
        message: "Question or image is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    /* ---------------------------------------------
       FIND / CREATE CHAT
    --------------------------------------------- */

    let chat = null;

    if (chatId) {
      chat = await NexAIChat.findById(chatId);
    }

    if (!chat) {
      chat = await NexAIChat.create({
        userId,
        title: getTitleFromQuestion(question),
        messages: [],
      });
    }

    if (!chat.title || chat.title === "New Chat") {
      chat.title = getTitleFromQuestion(question);
    }

    /* ---------------------------------------------
       CACHE
    --------------------------------------------- */

    const cacheKey = `${userId}:${question || "image"}`;

    const cached = cache.get(cacheKey);

    if (cached && !imageUrl) {
      chat.messages.push(
        {
          role: "user",
          content: question,
        },
        {
          role: "assistant",
          content: cached,
          type: "normal",
        }
      );

      await chat.save();

      return res.json({
        answer: cached,
        chat,
      });
    }

    /* =================================================
       PROVIDER 1
       OPENROUTER
    ================================================= */

    let text = null;

    try {
      console.log("🤖 Trying OpenRouter...");

      const conversation = [
        ...history
          .filter((msg) => msg?.content)
          .map((msg) => ({
            role:
              msg.role === "assistant"
                ? "assistant"
                : "user",
            content: String(msg.content),
          })),
        {
          role: "user",
          content: String(question || ""),
        },
      ];

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openrouter/free",
          messages: conversation,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",

            "HTTP-Referer":
              process.env.FRONTEND_URL ||
              "https://neo-ai-socializing-reinvented-with.vercel.app",

            "X-Title": "NexAI",
          },

          timeout: 30000,
        }
      );

      text =
        response.data?.choices?.[0]?.message?.content?.trim();

      if (text) {
        console.log("✅ OpenRouter succeeded");
      }
    } catch (error) {
      console.error(
        "❌ OpenRouter failed:",
        getErrorMessage(error)
      );
    }

    /* =================================================
       PROVIDER 2
       GROQ
    ================================================= */

    if (!text) {
      try {
        console.log("🤖 Trying Groq...");

        const conversation = [
          ...history
            .filter((msg) => msg?.content)
            .map((msg) => ({
              role:
                msg.role === "assistant"
                  ? "assistant"
                  : "user",
              content: String(msg.content),
            })),
          {
            role: "user",
            content: String(question || ""),
          },
        ];

        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "openai/gpt-oss-20b",
            messages: conversation,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },

            timeout: 30000,
          }
        );

        text =
          response.data?.choices?.[0]?.message?.content?.trim();

        if (text) {
          console.log("✅ Groq succeeded");
        }
      } catch (error) {
        console.error(
          "❌ Groq failed:",
          getErrorMessage(error)
        );
      }
    }

    /* =================================================
       PROVIDER 3
       GEMINI
    ================================================= */

    if (!text) {
      try {
        console.log("🤖 Trying Gemini...");

        const conversation = buildGeminiConversation(
          history,
          question
        );

        const response =
          await gemini.models.generateContent({
            model: "gemini-3.8-flash",
            contents: conversation,
          });

        text = response.text?.trim();

        if (text) {
          console.log("✅ Gemini succeeded");
        }
      } catch (error) {
        console.error(
          "❌ Gemini failed:",
          getErrorMessage(error)
        );
      }
    }

    /* =================================================
       ALL PROVIDERS FAILED
    ================================================= */

    if (!text) {
      console.error(
        "❌❌❌ ALL AI PROVIDERS FAILED"
      );

      return res.status(503).json({
        message:
          "⚠️ All AI services are currently unavailable. Please try again.",
      });
    }

    /* ---------------------------------------------
       CACHE SUCCESSFUL RESPONSE
    --------------------------------------------- */

    if (!imageUrl) {
      cache.set(cacheKey, text);
    }

    /* ---------------------------------------------
       SAVE CHAT
    --------------------------------------------- */

    chat.messages.push(
      {
        role: "user",
        content: question || "",
        image: imageUrl,
      },
      {
        role: "assistant",
        content: text,
        type: "normal",
      }
    );

    await chat.save();

    /* ---------------------------------------------
       RESPONSE
    --------------------------------------------- */

    return res.json({
      answer: text,
      chat,
    });
  } catch (err) {
    console.error(
      "❌ NexAI controller error:",
      err
    );

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/* =========================================================
   RENAME CHAT
========================================================= */

export const renameNexAIChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    const chat = await NexAIChat.findByIdAndUpdate(
      chatId,
      { title },
      { new: true }
    );

    res.json(chat);
  } catch (err) {
    console.error("Rename chat error:", err);

    res.status(500).json({
      message: "Failed to rename chat",
    });
  }
};

/* =========================================================
   PIN / UNPIN CHAT
========================================================= */

export const togglePinNexAIChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await NexAIChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    chat.pinned = !chat.pinned;

    await chat.save();

    res.json(chat);
  } catch (err) {
    console.error("Pin chat error:", err);

    res.status(500).json({
      message: "Failed to pin chat",
    });
  }
};