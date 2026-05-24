import { useState } from "react";

export default function CommentInput({ onSend }) {
  const [text, setText] = useState("");

  const send = async () => {
    if (!text.trim()) return;

    await onSend(text);

    // 🔥 refresh ML recommendations after comment
    window.dispatchEvent(new Event("reel-interaction-updated"));

    setText("");
  };

  return (
    <div className="d-flex gap-2 border-top pt-2">
      <input
        className="form-control bg-dark text-white border-0"
        placeholder="Write a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
      />
      <button onClick={send} className="btn btn-primary">
        Send
      </button>
    </div>
  );
}