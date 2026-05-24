import { useState, useContext } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/AuthContext";

const getMediaUrl = (file) => {
  if (!file) return "/default-dp.png";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function CommentItem({ comment, onDeleted, onUpdated }) {
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(comment.text);

  const dp = getMediaUrl(comment.user?.dp);

  const isOwner = user?._id === comment.user?._id;

  const handleDelete = async () => {
    await axios.delete(`${API_URL}/api/comments/${comment._id}`, {
      withCredentials: true,
    });

    onDeleted(comment._id);
  };

  const handleUpdate = async () => {
    const res = await axios.put(
      `${API_URL}/api/comments/${comment._id}`,
      { text },
      { withCredentials: true }
    );

    onUpdated(res.data);
    setIsEditing(false);
  };

  return (
    <div className="d-flex gap-2 mb-3 position-relative">
      <img
        src={dp}
        onError={(e) => (e.target.src = "/default-dp.png")}
        alt=""
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />

      <div style={{ flex: 1 }}>
        <b>{comment.user?.username}</b>

        {isEditing ? (
          <div className="d-flex gap-2 mt-1">
            <input
              className="form-control form-control-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn btn-sm btn-primary" onClick={handleUpdate}>
              Save
            </button>
          </div>
        ) : (
          <p className="mb-0">{comment.text}</p>
        )}
      </div>

      {isOwner && (
        <div>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ⋮
          </span>

          {menuOpen && (
            <div
              className="position-absolute bg-dark text-white p-2 rounded"
              style={{ right: 0, top: 20, zIndex: 99 }}
            >
              <div
                className="cursor-pointer"
                onClick={() => {
                  setIsEditing(true);
                  setMenuOpen(false);
                }}
              >
                Edit
              </div>

              <div
                className="text-danger cursor-pointer"
                onClick={handleDelete}
              >
                Delete
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}