import { useState, useContext, useRef } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/AuthContext";
import EmojiPicker from "emoji-picker-react";

export default function MessageInput({ selectedUser, setMessages }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileRef = useRef(null);
  const { currentUser } = useContext(AuthContext);

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const sendMessage = async (file = null) => {
    if (!text.trim() && !file) return;

    const tempId = Date.now().toString();

    const tempMessage = {
      _id: tempId,
      sender: currentUser,
      receiver: selectedUser,
      text,
      media: file ? URL.createObjectURL(file) : null,
      messageType: file
        ? file.type.includes("image")
          ? "image"
          : file.type.includes("video")
          ? "video"
          : "file"
        : "text",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    setText("");
    setShowEmoji(false);

    try {
      const formData = new FormData();

      formData.append("receiver", selectedUser._id);
      formData.append("text", text);

      if (file) {
        formData.append("media", file);
      }

      const res = await axios.post(
        `${API_URL}/api/messages`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },

          // ✅ Upload progress
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          },
        }
      );

      const realMessage = res.data;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? realMessage : msg
        )
      );

      setUploadProgress(0);

    } catch (err) {
      console.error("Send message error", err);

      setMessages((prev) =>
        prev.filter((msg) => msg._id !== tempId)
      );

      setUploadProgress(0);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    sendMessage(file);
  };

  return (
    <div
      className="p-3"
      style={{ borderTop: "1px solid #2c2c2c", position: "relative" }}
    >
      <div className="d-flex gap-2 align-items-center">

        {/* EMOJI */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowEmoji(!showEmoji)}
        >
          😊
        </button>

        {/* FILE */}
        <button
          className="btn btn-secondary"
          onClick={() => fileRef.current.click()}
        >
          📎
        </button>

        <input
          type="file"
          ref={fileRef}
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />

        {/* TEXT INPUT */}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="form-control bg-dark text-white border-0"
          placeholder="Message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />

        <button
          onClick={() => sendMessage()}
          className="btn btn-primary"
        >
          Send
        </button>
      </div>

      {/* Upload progress */}
      {uploadProgress > 0 && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: "#aaa",
          }}
        >
          Uploading... {uploadProgress}%
        </div>
      )}

      {/* EMOJI PICKER */}
      {showEmoji && (
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "10px",
            zIndex: 1000,
          }}
        >
          <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
        </div>
      )}
    </div>
  );
}
