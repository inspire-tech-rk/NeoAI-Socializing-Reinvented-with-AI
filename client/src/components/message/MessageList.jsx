import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/AuthContext";

const getMediaUrl = (file) => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function MessageList({ messages = [], selectedUser }) {
  const [localMessages, setLocalMessages] = useState(messages);
  const [translations, setTranslations] = useState({});

  const { currentUser } = useContext(AuthContext);
  const bottomRef = useRef(null);

  const [menu, setMenu] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    const closeMenu = () => setMenu(null);
    window.addEventListener("click", closeMenu);

    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const deleteMessage = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/messages/${id}`, {
        withCredentials: true,
      });

      setLocalMessages((prev) => prev.filter((msg) => msg._id !== id));
      setMenu(null);
    } catch (err) {
      console.error("Delete message error", err);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setMenu(null);
  };

  const downloadMedia = (media) => {
    const link = document.createElement("a");
    link.href = getMediaUrl(media);
    link.download = media;
    link.click();
    setMenu(null);
  };

  const handleRightClick = (e, msg) => {
    e.preventDefault();

    setMenu({
      x: e.pageX,
      y: e.pageY,
      message: msg,
    });
  };

  const translateMessage = async (msg, targetLang = "hi") => {
    try {
      const text = msg.text || msg.message || "";
      if (!text) return;

      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
          text
        )}`
      );

      const data = await res.json();
      const translatedText = data[0].map((item) => item[0]).join("");

      setTranslations((prev) => ({
        ...prev,
        [msg._id]: translatedText,
      }));

      setMenu(null);
    } catch (err) {
      console.error("Translation error", err);
    }
  };

  const speakText = (text, lang = "hi-IN") => {
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = lang;
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  };

  const languages = [
    { code: "hi", name: "Hindi 🇮🇳" },
    { code: "en", name: "English 🇺🇸" },
    { code: "fr", name: "French 🇫🇷" },
    { code: "es", name: "Spanish 🇪🇸" },
    { code: "de", name: "German 🇩🇪" },
    { code: "ar", name: "Arabic 🇸🇦" },
  ];

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "15px",
        minHeight: 0,
      }}
    >
      {localMessages?.map((msg, index) => {
        const senderId = msg.sender?._id || msg.sender || msg.senderId || null;

        const isMe =
          senderId && senderId.toString() !== selectedUser?._id?.toString();

        return (
          <div
            key={msg?._id || index}
            style={{
              display: "flex",
              justifyContent: isMe ? "flex-end" : "flex-start",
              marginBottom: "8px",
            }}
          >
            <div
              onContextMenu={(e) => handleRightClick(e, msg)}
              style={{
                background: isMe ? "#0095F6" : "#262626",
                color: "white",
                padding: "10px 14px",
                borderRadius: "20px",
                maxWidth: "65%",
                fontSize: "14px",
                wordBreak: "break-word",
                position: "relative",
                cursor: "pointer",
              }}
            >
              {msg.text && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ flex: 1 }}>{msg.text}</span>

                    {isMe && (
                      <span style={{ fontSize: "11px", opacity: 0.7 }}>
                        {msg.status === "sent" && "✓"}
                        {msg.status === "delivered" && "✓✓"}
                        {msg.status === "seen" && "✓✓ 👁"}
                      </span>
                    )}

                    <span
                      onClick={() => speakText(msg.text, "en-US")}
                      style={{ marginLeft: "8px", cursor: "pointer" }}
                    >
                      🔊
                    </span>
                  </div>

                  {translations[msg._id] && (
                    <div
                      style={{
                        fontSize: "12px",
                        marginTop: "5px",
                        opacity: 0.7,
                      }}
                    >
                      🌐 {translations[msg._id]}

                      <span
                        onClick={() =>
                          speakText(translations[msg._id], "hi-IN")
                        }
                        style={{ marginLeft: "8px", cursor: "pointer" }}
                      >
                        🔊
                      </span>
                    </div>
                  )}
                </div>
              )}

              {msg.messageType === "image" && msg.media && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginTop: "5px",
                  }}
                >
                  <img
                    src={getMediaUrl(msg.media)}
                    alt="sent-media"
                    style={{
                      maxWidth: "220px",
                      borderRadius: "10px",
                      display: "block",
                    }}
                  />

                  {isMe && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "5px",
                        right: "8px",
                        fontSize: "11px",
                        opacity: 0.7,
                      }}
                    >
                      {msg.status === "sent" && "✓"}
                      {msg.status === "delivered" && "✓✓"}
                      {msg.status === "seen" && "✓✓ 👁"}
                    </span>
                  )}
                </div>
              )}

              {msg.messageType === "video" && msg.media && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginTop: "5px",
                  }}
                >
                  <video
                    src={getMediaUrl(msg.media)}
                    controls
                    style={{
                      maxWidth: "220px",
                      borderRadius: "10px",
                      display: "block",
                    }}
                  />

                  {isMe && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "5px",
                        right: "8px",
                        fontSize: "11px",
                        opacity: 0.7,
                      }}
                    >
                      {msg.status === "sent" && "✓"}
                      {msg.status === "delivered" && "✓✓"}
                      {msg.status === "seen" && "✓✓ 👁"}
                    </span>
                  )}
                </div>
              )}

              {msg.messageType === "file" && msg.media && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginTop: "5px",
                  }}
                >
                  <a
                    href={getMediaUrl(msg.media)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#fff",
                      textDecoration: "underline",
                      display: "block",
                    }}
                  >
                    📎 Download File
                  </a>

                  {isMe && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "0px",
                        right: "0px",
                        fontSize: "11px",
                        opacity: 0.7,
                      }}
                    >
                      {msg.status === "sent" && "✓"}
                      {msg.status === "delivered" && "✓✓"}
                      {msg.status === "seen" && "✓✓ 👁"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {menu && (
        <div
          style={{
            position: "absolute",
            top: menu.y,
            left: menu.x,
            background: "#1e1e1e",
            borderRadius: "8px",
            padding: "6px 0",
            width: "160px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
            zIndex: 999,
          }}
        >
          {menu.message.text && (
            <div onClick={() => copyText(menu.message.text)} style={menuItem}>
              📋 Copy
            </div>
          )}

          {menu.message.text && (
            <div style={{ padding: "5px 10px" }}>
              🌐 Translate:
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => translateMessage(menu.message, lang.code)}
                  style={{
                    padding: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  {lang.name}
                </div>
              ))}
            </div>
          )}

          {menu.message.media && (
            <div
              onClick={() => downloadMedia(menu.message.media)}
              style={menuItem}
            >
              ⬇ Download
            </div>
          )}

          <div
            onClick={() => deleteMessage(menu.message._id)}
            style={{ ...menuItem, color: "#ff4d4f" }}
          >
            🗑 Delete
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

const menuItem = {
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "14px",
};