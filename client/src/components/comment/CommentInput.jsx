import { useState } from "react";

export default function CommentInput({ onSend }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
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