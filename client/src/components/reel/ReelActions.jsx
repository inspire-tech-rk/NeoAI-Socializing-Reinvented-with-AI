import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { API_URL } from "../../config";
import LikeListModal from "../LikeListModal";

export default function ReelActions({ post, onComment }) {
  const { currentUser } = useContext(AuthContext);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes?.length || 0);
  const [showLikesModal, setShowLikesModal] = useState(false);

  useEffect(() => {
    if (post?.likes && currentUser?._id) {
      setLiked(post.likes.includes(currentUser._id));
      setLikeCount(post.likes.length);
    }
  }, [post, currentUser]);

  const toggleLike = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${post._id}/like`, // ✅ ALWAYS POST
        {},
        { withCredentials: true }
      );

      setLiked(res.data.liked);
      setLikeCount(res.data.likesCount);

      // 🔥 GLOBAL UPDATE EVENT
      window.dispatchEvent(
        new CustomEvent("post-like-updated", {
          detail: {
            postId: post._id,
            post: res.data,
          },
        })
      );

    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const shareReel = async () => {
    const url = `${window.location.origin}/post/${post._id}`;

    if (navigator.share) {
      await navigator.share({ title: "Check this reel", url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Reel link copied");
    }
  };

  return (
    <>
      <div
        className="position-absolute d-flex flex-column align-items-center"
        style={{ right: 12, bottom: 100, gap: 18, color: "#fff", fontSize: 22 }}
      >
        {/* ❤️ LIKE */}
        <span
          onClick={toggleLike}
          style={{
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: liked ? "red" : "#fff",
          }}
        >
          {liked ? "❤️" : "🤍"}

          <span
            style={{ fontSize: 14 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowLikesModal(true);
            }}
          >
            {likeCount}
          </span>
        </span>

        {/* 💬 */}
        <span onClick={onComment} style={{ cursor: "pointer" }}>
          💬
        </span>

        {/* 📤 */}
        <span onClick={shareReel} style={{ cursor: "pointer" }}>
          📤
        </span>

        <span>⋯</span>
      </div>

      {showLikesModal && (
        <LikeListModal
          likes={post.likes || []}
          onClose={() => setShowLikesModal(false)}
        />
      )}
    </>
  );
}
