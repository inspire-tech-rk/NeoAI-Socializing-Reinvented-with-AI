import { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/AuthContext";
import CommentBox from "../comment/CommentBox";
import LikeListModal from "../LikeListModal";

function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      video.play().catch(() => {});
    };

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [src]);

  if (error) {
    return (
      <div className="text-white text-center p-4 bg-dark w-100">
        Video format not supported
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      key={src}
      muted
      loop
      playsInline
      preload="metadata"
      controls
      className="w-100 h-100"
      style={{ objectFit: "cover", background: "black" }}
      onError={() => setError(true)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

export default function PostPreviewModal({ post, onClose }) {
 const { user: currentUser } = useContext(AuthContext);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes?.length || 0);
  const [showHeart, setShowHeart] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);

  useEffect(() => {
    if (post?.likes && currentUser?._id) {
      setLiked(
        post.likes.some(
          (l) => l._id?.toString() === currentUser._id.toString(),
        ),
      );
      setLikeCount(post.likes.length);
    }
  }, [post, currentUser]);

  if (!post) return null;

  const toggleLike = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${post._id}/like`,
        {},
        { withCredentials: true },
      );

      setLiked(res.data.liked);
      setLikeCount(res.data.likesCount);
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const getMediaUrl = (file) => {
    if (!file) return "";

    if (file.startsWith("http")) {
      return file;
    }

    return `${API_URL}/${file.replace(/^\/+/, "")}`;
  };

  const mediaUrl = getMediaUrl(post.file);
  const isVideo =
    post.type === "video" ||
    post.type === "reel" ||
    /\.(mp4|webm|mov|mkv)$/i.test(post.file || "");
  const handleDoubleClick = async () => {
    if (!liked) {
      await toggleLike();
    }

    setShowHeart(true);
    setTimeout(() => {
      setShowHeart(false);
    }, 700);
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
        style={{ zIndex: 1050 }}
        onClick={onClose}
      />

      {/* MODAL */}
      <div
        className="position-fixed top-50 start-50 translate-middle bg-white rounded shadow d-flex"
        style={{
          width: "800px",
          height: "635px",
          zIndex: 1060,
          overflow: "hidden",
        }}
      >
        {/* IMAGE / VIDEO */}
        <div className="w-50 bg-black d-flex align-items-center justify-content-center">
          <div
            className="w-100 h-100 position-relative"
            onDoubleClick={handleDoubleClick}
          >
            {isVideo ? (
              <VideoPlayer src={mediaUrl} />
            ) : (
              <img
                src={mediaUrl}
                alt="post"
                className="w-100 h-100"
                style={{
                  objectFit: "contain",
                  background: "black",
                }}
              />
            )}

            {showHeart && <div className="heart-pop">❤️</div>}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-50 d-flex flex-column">
          {/* HEADER */}
          <div className="p-3 border-bottom d-flex align-items-center gap-2">
            <img
              src={
                post?.user?.dp ? getMediaUrl(post.user.dp) : "/default-dp.png"
              }
              className="rounded-circle"
              width="35"
              height="35"
              alt=""
            />
            <strong>{post?.user?.username}</strong>
          </div>

          {/* ❤️ LIKE SECTION (CONNECTED TO BACKEND) */}
          <div className="p-3 border-bottom d-flex align-items-center gap-2">
            <span
              onClick={toggleLike}
              style={{
                cursor: "pointer",
                fontSize: "22px",
                color: liked ? "red" : "gray",
                transition: "0.2s",
              }}
            >
              {liked ? "❤️" : "🤍"}
            </span>
            <span
              style={{ fontWeight: "500", cursor: "pointer" }}
              onClick={() => setShowLikesModal(true)}
            >
              {likeCount} likes
            </span>
          </div>

          {/* COMMENTS */}
          <div className="flex-grow-1 p-3 overflow-auto">
            <CommentBox
              targetId={post._id} // 🔥 ALWAYS POST
              targetType="post"
            />
          </div>
        </div>
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
