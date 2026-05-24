import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

export default function PostMeta({ post }) {
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
       const res = await axios.get(
  `${API_URL}/api/comments/post/${post._id}`,
  {
    withCredentials: true,
  }
);

        setComments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load comments", err);
      }
    };

    if (post?._id) fetchComments();
  }, [post?._id]);

  return (
    <div className="px-2 pb-2">
      <p className="mb-1">
        <strong>{post.user?.username}</strong>{" "}
        {post.caption || ""}
      </p>

      {comments.length > 0 && (
        <>
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#777",
              fontSize: "14px",
              cursor: "pointer",
              marginBottom: "4px",
            }}
          >
            {showComments
              ? "Hide comments"
              : `View all ${comments.length} comments`}
          </button>

          {showComments && (
            <div>
              {comments.map((comment) => (
                <p
                  key={comment._id}
                  className="mb-1"
                  style={{ fontSize: "14px" }}
                >
                  <strong>{comment.user?.username || "User"}</strong>{" "}
                  {comment.text}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}