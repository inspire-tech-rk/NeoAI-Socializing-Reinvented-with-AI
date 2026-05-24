import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function NexAI() {
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const chatContainerRef = useRef(null);
  const bottomRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id || user?.user?._id;

  const scrollBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const loadChats = async () => {
    if (!userId) return;

    const res = await axios.get(`${API_URL}/api/nexai/chats/${userId}`, {
      withCredentials: true,
    });

    setChats(res.data.sort((a, b) => b.pinned - a.pinned));

    if (res.data.length > 0 && !activeChatId) {
      setActiveChatId(res.data[0]._id);
      setMessages(res.data[0].messages || []);
    }
  };

  useEffect(() => {
    loadChats();
  }, [userId]);

  useEffect(() => {
    scrollBottom();
  }, [messages]);

  const createNewChat = async () => {
    const res = await axios.post(
      `${API_URL}/api/nexai/chat`,
      { userId },
      { withCredentials: true }
    );

    setChats((prev) => [res.data, ...prev]);
    setActiveChatId(res.data._id);
    setMessages([]);
  };

  const openChat = async (chatId) => {
    const res = await axios.get(`${API_URL}/api/nexai/chat/${chatId}`, {
      withCredentials: true,
    });

    setActiveChatId(chatId);
    setMessages(res.data.messages || []);
    setOpenMenuId(null);
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();

    await axios.delete(`${API_URL}/api/nexai/chat/${chatId}`, {
      withCredentials: true,
    });

    const remaining = chats.filter((c) => c._id !== chatId);
    setChats(remaining);
    setOpenMenuId(null);

    if (activeChatId === chatId) {
      if (remaining.length > 0) {
        setActiveChatId(remaining[0]._id);
        setMessages(remaining[0].messages || []);
      } else {
        setActiveChatId(null);
        setMessages([]);
      }
    }
  };

  const renameChat = async (chatId) => {
    const title = prompt("Enter new chat name:");
    if (!title?.trim()) return;

    const res = await axios.put(
      `${API_URL}/api/nexai/chat/${chatId}/rename`,
      { title },
      { withCredentials: true }
    );

    setChats((prev) =>
      prev.map((c) => (c._id === chatId ? res.data : c))
    );

    setOpenMenuId(null);
  };

  const pinChat = async (chatId) => {
    const res = await axios.put(
      `${API_URL}/api/nexai/chat/${chatId}/pin`,
      {},
      { withCredentials: true }
    );

    setChats((prev) =>
      prev
        .map((c) => (c._id === chatId ? res.data : c))
        .sort((a, b) => b.pinned - a.pinned)
    );

    setOpenMenuId(null);
  };

  const shareChat = async (chat) => {
    const url = `${window.location.origin}/nexai?chat=${chat._id}`;

    if (navigator.share) {
      await navigator.share({
        title: chat.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Chat link copied");
    }

    setOpenMenuId(null);
  };

  const clearAllChats = async () => {
    if (!window.confirm("Delete all chats?")) return;

    await axios.delete(`${API_URL}/api/nexai/clear/${userId}`, {
      withCredentials: true,
    });

    setChats([]);
    setActiveChatId(null);
    setMessages([]);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    let chatId = activeChatId;

    if (!chatId) {
      const newChat = await axios.post(
        `${API_URL}/api/nexai/chat`,
        { userId },
        { withCredentials: true }
      );

      chatId = newChat.data._id;
      setActiveChatId(chatId);
      setChats((prev) => [newChat.data, ...prev]);
    }

    const userMessage = {
      role: "user",
      content: query,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setQuery("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/nexai/ask`,
        {
          question: query,
          history: messages,
          userId,
          chatId,
        },
        { withCredentials: true }
      );

      const aiMessage = {
        role: "assistant",
        content: res.data.answer,
        type: "normal",
      };

      setMessages([...updatedMessages, aiMessage]);

      setChats((prev) => {
        const filtered = prev.filter((c) => c._id !== res.data.chat._id);
        return [res.data.chat, ...filtered].sort(
          (a, b) => b.pinned - a.pinned
        );
      });

      setActiveChatId(res.data.chat._id);
    } catch (err) {
      const serverMessage =
        err.response?.data?.message || "⚠️ AI service unavailable.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: serverMessage,
          type: "error",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div
      className="d-flex bg-black text-white"
      style={{ height: "100vh", width: "100%" }}
    >
      {/* LEFT CHAT HISTORY */}
      <div
        style={{
          width: 280,
          borderRight: "1px solid #2c2c2c",
          background: "#050505",
          padding: "12px",
          overflowY: "auto",
        }}
      >
        <button className="btn btn-primary w-100 mb-3" onClick={createNewChat}>
          + New Chat
        </button>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Recent Chats</strong>
          {chats.length > 0 && (
            <button className="btn btn-sm btn-danger" onClick={clearAllChats}>
              Clear
            </button>
          )}
        </div>

        {chats.length === 0 && (
          <p className="text-secondary small">No chats yet</p>
        )}

        {chats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => openChat(chat._id)}
            className="d-flex justify-content-between align-items-center position-relative"
            style={{
              padding: "10px",
              borderRadius: "8px",
              cursor: "pointer",
              background: activeChatId === chat._id ? "#1c1c1c" : "transparent",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "190px",
              }}
            >
              {chat.pinned && "📌 "}
              {chat.title || "New Chat"}
            </span>

            <span
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === chat._id ? null : chat._id);
              }}
              style={{ cursor: "pointer", padding: "0 6px" }}
            >
              ⋮
            </span>

            {openMenuId === chat._id && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  right: "5px",
                  top: "36px",
                  background: "#222",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  padding: "6px 0",
                  width: "130px",
                  zIndex: 999,
                }}
              >
                <div style={menuItem} onClick={() => renameChat(chat._id)}>
                  Rename
                </div>

                <div style={menuItem} onClick={() => pinChat(chat._id)}>
                  {chat.pinned ? "Unpin Chat" : "Pin Chat"}
                </div>

                <div style={menuItem} onClick={() => shareChat(chat)}>
                  Share Chat
                </div>

                <div
                  style={{ ...menuItem, color: "#ff4d4f" }}
                  onClick={(e) => deleteChat(chat._id, e)}
                >
                  Delete
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RIGHT CHAT AREA */}
      <div className="flex-grow-1 d-flex flex-column">
        <div className="text-center py-3 border-bottom border-secondary">
          <h4 className="fw-bold">🤖 NexAI Assistant</h4>
          <small>Ask anything — powered by AI</small>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-grow-1 overflow-auto p-3"
          style={{ background: "#000" }}
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
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-secondary small">NexAI is thinking...</div>
          )}

          <div ref={bottomRef}></div>
        </div>

        <form
          onSubmit={handleSearch}
          className="p-3 border-top border-secondary d-flex gap-2"
          style={{ background: "#000" }}
        >
          <input
            type="text"
            className="form-control bg-dark text-white border-secondary"
            placeholder="Ask NexAI anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button type="submit" className="btn btn-primary px-4" disabled={loading}>
            {loading ? "..." : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}

const menuItem = {
  padding: "8px 12px",
  fontSize: "14px",
  cursor: "pointer",
  color: "#fff",
};