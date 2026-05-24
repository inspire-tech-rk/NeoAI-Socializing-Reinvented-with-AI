import NexAIChat from "../models/NexAIChat.js";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import NodeCache from "node-cache";
import dotenv from "dotenv";

dotenv.config();

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const cache = new NodeCache({
  stdTTL: 600,
});

const getTitleFromQuestion = (question) => {
  if (!question) return "New Chat";
  return question.length > 35 ? question.slice(0, 35) + "..." : question;
};

export const createNexAIChat = async (req, res) => {
  try {
    const { userId } = req.body;

    const chat = await NexAIChat.create({
      userId,
      title: "New Chat",
      messages: [],
    });

    res.status(201).json(chat);
  } catch (err) {
    console.error("Create NexAI chat error:", err);
    res.status(500).json({ message: "Failed to create chat" });
  }
};

export const getNexAIChats = async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await NexAIChat.find({ userId })
      .select("title createdAt updatedAt messages")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error("Get NexAI chats error:", err);
    res.status(500).json({ message: "Failed to load chats" });
  }
};

export const getSingleNexAIChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await NexAIChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(chat);
  } catch (err) {
    console.error("Get single NexAI chat error:", err);
    res.status(500).json({ message: "Failed to load chat" });
  }
};

export const deleteNexAIChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    await NexAIChat.findByIdAndDelete(chatId);

    res.json({ message: "Chat deleted" });
  } catch (err) {
    console.error("Delete NexAI chat error:", err);
    res.status(500).json({ message: "Failed to delete chat" });
  }
};

export const clearNexAIChats = async (req, res) => {
  try {
    const { userId } = req.params;

    await NexAIChat.deleteMany({ userId });

    res.json({ message: "All chats cleared" });
  } catch (err) {
    console.error("Clear NexAI chats error:", err);
    res.status(500).json({ message: "Failed to clear chats" });
  }
};

export const askNexAI = async (req, res) => {
  try {
    const { question, history, userId, chatId } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    let chat;

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

    const cacheKey = `${userId}:${question}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      chat.messages.push(
        { role: "user", content: question },
        { role: "assistant", content: cached, type: "normal" }
      );

      await chat.save();

      return res.json({
        answer: cached,
        chat,
      });
    }

    let text = null;

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
            "HTTP-Referer": process.env.FRONTEND_URL || "https://neo-ai-socializing-reinvented-with.vercel.app",
            "X-Title": "NexAI",
          },
        }
      );

      text = response.data.choices[0].message.content;
      console.log("✅ Answer from OpenRouter");
    } catch (err) {
      console.error("OpenRouter failed:", err.response?.data || err.message);
    }

    if (!text) {
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
          }
        );

        text = response.data.choices[0].message.content;
        console.log("✅ Answer from Groq");
      } catch (err) {
        console.error("Groq failed:", err.response?.data || err.message);
      }
    }

    if (!text) {
      try {
        const response = await gemini.models.generateContent({
          model: "gemini-2.0-flash",
          contents: conversation.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.content }],
          })),
        });

        text = response.text;
        console.log("✅ Answer from Gemini");
      } catch (err) {
        console.error("Gemini failed:", err.response?.data || err.message);
      }
    }

    if (!text) {
      return res.status(500).json({
        message: "⚠️ All AI services failed. Try again later.",
      });
    }

    cache.set(cacheKey, text);

    chat.messages.push(
      { role: "user", content: question },
      { role: "assistant", content: text, type: "normal" }
    );

    await chat.save();

    res.json({
      answer: text,
      chat,
    });
  } catch (err) {
    console.error("NexAI controller error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};