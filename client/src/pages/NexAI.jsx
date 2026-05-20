import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function NexAI() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const typingRef = useRef(null);

const chatContainerRef = useRef(null);

const bottomRef = useRef(null);

const shouldAutoScroll = useRef(true);


  // ✅ USER ID
  const user = JSON.parse(localStorage.getItem("user"));

  console.log("USER:", user);

  const userId = user?._id || user?.user?._id;

  console.log("USER ID:", userId);

  // =========================================
  // ✅ LOAD CHATS FROM DATABASE
  // =========================================
 useEffect(() => {
  const loadChats = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/nexai/history/${userId}`
      );

      setMessages(res.data);

      // ✅ OPEN FROM BOTTOM
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: "auto",
        });
      }, 100);

    } catch (err) {
      console.log(err);
    }
  };

  if (userId) {
    loadChats();
  }
}, [userId]);

// =========================================
// ✅ SMART AUTO SCROLL
// =========================================
useEffect(() => {
  // ✅ Only auto scroll if user is already near bottom
  if (shouldAutoScroll.current) {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);
  }
}, [messages]);




  // =========================================
  // ✅ TYPEWRITER EFFECT
  // =========================================
  const typeMessage = (text) => {
    let index = 0;

    setTypingText("");

    clearInterval(typingRef.current);

    typingRef.current = setInterval(() => {
      setTypingText((prev) => prev + text[index]);

      index++;

      if (index >= text.length) {
        clearInterval(typingRef.current);
      }
    }, 20);
  };

  // =========================================
// ✅ DETECT USER SCROLL
// =========================================
const handleScroll = () => {
  const container = chatContainerRef.current;

  if (!container) return;

  const threshold = 100;

  const isNearBottom =
    container.scrollHeight -
      container.scrollTop -
      container.clientHeight <
    threshold;

  shouldAutoScroll.current = isNearBottom;
};

  // =========================================
  // ✅ HANDLE SEARCH
  // =========================================
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    // ✅ USER MESSAGE
    const userMessage = {
      role: "user",
      content: query,
    };

    // ✅ UPDATE CHAT
    const updatedMessages = [...messages, userMessage];

    // ✅ SHOW USER MESSAGE
    setMessages(updatedMessages);

    setQuery("");

    setLoading(true);

    try {
      // ✅ SEND TO BACKEND
      const res = await axios.post(
        "http://localhost:5000/api/nexai/ask",
        {
          question: query,
          history: updatedMessages,
          userId,
        },
        {
          withCredentials: true,
        },
      );

      // ✅ AI MESSAGE
      const aiMessage = {
        role: "assistant",
        content: res.data.answer,
        type: "normal",
      };

      // ✅ SHOW AI MESSAGE
      setMessages((prev) => [...prev, aiMessage]);

      // ✅ START TYPING EFFECT
      typeMessage(res.data.answer);
    } catch (err) {
      console.error("NexAI Error:", err);

      // ✅ ERROR MESSAGE
      const serverMessage =
        err.response?.data?.message || "⚠️ AI service unavailable.";

      const errorMessage = {
        role: "assistant",
        content: serverMessage,
        type: "error",
      };

      setMessages((prev) => [...prev, errorMessage]);

      typeMessage(serverMessage);
    }

    setLoading(false);
  };

  // =========================================
  // ✅ CLEAR CHAT
  // =========================================
  const clearChat = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/nexai/clear/${userId}`);

      setMessages([]);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="container-fluid vh-100 bg-black text-white d-flex flex-column">
      {/* HEADER */}
      <div className="text-center py-3 border-bottom border-secondary position-relative">
        <h4 className="fw-bold">🤖 NexAI Assistant</h4>

        <small>Ask anything — powered by AI</small>

        {/* CLEAR BUTTON */}
        <button
          className="btn btn-sm btn-danger position-absolute"
          style={{
            right: "20px",
            top: "20px",
          }}
          onClick={clearChat}
        >
          Clear
        </button>
      </div>

      {/* CHAT MESSAGES */}
     <div
  ref={chatContainerRef}
  onScroll={handleScroll}
  className="flex-grow-1 overflow-auto p-3"
  style={{
    background: "#000",
  }}
>
        {messages.length === 0 && (
          <div className="text-center text-secondary mt-5">
            Ask your first question ✨
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`d-flex mb-3 ${
              msg.role === "user"
                ? "justify-content-end"
                : "justify-content-start"
            }`}
          >
            <div
              className="px-3 py-2 rounded"
              style={{
                maxWidth: "75%",

                background:
                  msg.role === "user"
                    ? "#0d6efd"
                    : msg.type === "error"
                      ? "#dc3545"
                      : "#1c1c1c",

                color: "#fff",

                fontWeight: msg.type === "error" ? "bold" : "normal",

                whiteSpace: "pre-wrap",
              }}
            >
              {msg.role === "assistant" &&
              idx === messages.length - 1 &&
              loading &&
              msg.type !== "error"
                ? typingText
                : msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef}></div>

        {/* LOADING */}
        {loading && (
          <div className="text-secondary small">NexAI is thinking...</div>
        )}
       
      </div>

      {/* INPUT FORM */}
      <form
        onSubmit={handleSearch}
        className="p-3 border-top border-secondary d-flex gap-2"
        style={{
          background: "#000",
        }}
      >
        <input
          type="text"
          className="form-control bg-dark text-white border-secondary"
          placeholder="Ask NexAI anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button
          type="submit"
          className="btn btn-primary px-4"
          disabled={loading}
        >
          {loading ? "..." : "Ask"}
        </button>
      </form>
    </div>
  );
}
