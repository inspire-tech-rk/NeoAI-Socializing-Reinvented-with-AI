import { useContext, useState } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { API_URL } from "../../../config";
import LikeListModal from "../../LikeListModal";

export default function PostAction({ post, onCommentClick, onUpdate }) {
  const { currentUser } = useContext(AuthContext);
  const [showLikesModal, setShowLikesModal] = useState(false);

  // ✅ ONLY ONE SOURCE OF TRUTH
  const likesArray = post.likes || [];

  // ✅ DERIVED STATE
  const liked = likesArray.some(
    (l) => l._id?.toString() === currentUser?._id?.toString()
  );

  const likeCount = likesArray.length;

  // ✅ FIXED TOGGLE LIKE (POST ONLY)
  const toggleLike = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${post._id}/like`,
        {},
        { withCredentials: true }
      );

      // 🔥 update parent state (instant UI)
      if (onUpdate) {
        onUpdate((prev) =>
          prev.map((p) =>
            p._id === post._id
              ? { ...p, likes: res.data.likes }
              : p
          )
        );
      }

      // 🔥 GLOBAL SYNC (CRITICAL)
      window.dispatchEvent(
        new CustomEvent("post-like-updated", {
          detail: {
            postId: post._id,
            post: {
              ...post,
              likes: res.data.likes,
            },
          },
        })
      );

    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const sharePost = async () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check this post",
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        alert("Post link copied to clipboard");
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  return (
    <>
      <div className="d-flex align-items-center gap-4 p-2 fs-5">
        {/* ❤️ LIKE */}
        <span
          onClick={toggleLike}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: liked ? "red" : "gray",
            transition: "0.2s",
          }}
        >
          {liked ? "❤️" : "🤍"}

          <span
            style={{ fontSize: "14px", cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setShowLikesModal(true);
            }}
          >
            {likeCount}
          </span>
        </span>

        {/* 💬 COMMENT */}
        <span onClick={onCommentClick} style={{ cursor: "pointer" }}>
          💬
        </span>

        {/* 📤 SHARE */}
        <span onClick={sharePost} style={{ cursor: "pointer" }}>
          📤
        </span>

        {/* 🔖 BOOKMARK */}
        <span className="ms-auto" style={{ cursor: "pointer" }}>
          🔖
        </span>
      </div>

      {showLikesModal && (
        <LikeListModal
          likes={likesArray}
          onClose={() => setShowLikesModal(false)}
        />
      )}
    </>
  );
}
