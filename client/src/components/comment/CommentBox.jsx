import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import CommentList from "./CommentList";

export default function CommentBox({ targetId, targetType }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ FETCH COMMENTS (SAFE)
  const fetchComments = async () => {
    try {
      // 🔥 IMPORTANT SAFETY CHECK
      if (!targetId || targetId === "undefined") {
        console.warn("Invalid targetId:", targetId);
        return;
      }

      const res = await axios.get(
        `${API_URL}/api/comments/${targetType}/${targetId}`, // ✅ CORRECT API
        { withCredentials: true }
      );

      setComments(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [targetId, targetType]);

  // ✅ ADD COMMENT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    // 🔥 SAFETY AGAIN
    if (!targetId || targetId === "undefined") {
      alert("Invalid target. Please refresh.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/comments`,
        {
          text,
          targetId,     // ✅ correct
          targetType    // ✅ correct
        },
        { withCredentials: true }
      );

      setComments((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  const handleDelete = (id) => {
    setComments((prev) => prev.filter((c) => c._id !== id));
  };

  const handleUpdate = (updated) => {
    setComments((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );
  };

  return (
    <>
      <CommentList
        comments={comments}
        loading={loading}
        onDeleted={handleDelete}
        onUpdated={handleUpdate}
      />

      <form onSubmit={handleSubmit} className="d-flex gap-2 mt-2">
        <input
          className="form-control bg-dark text-white border-0"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          required
        />
        <button className="btn btn-primary">Send</button>
      </form>
    </>
  );
}
