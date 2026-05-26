import { useEffect, useState, useRef, useContext } from "react";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const getMediaUrl = (file) => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function StoryViewer({
  stories: initialStories = [],
  onClose,
  onDeleteStory,
}) {
  const [stories, setStories] = useState(initialStories);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user: loggedInUser } = useContext(AuthContext);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  const story = stories[index];

  const nextStory = () => {
    setMenuOpen(false);
    setCommentText("");

    if (index < stories.length - 1) setIndex(index + 1);
    else onClose();
  };

  const prevStory = () => {
    setMenuOpen(false);
    setCommentText("");

    if (index > 0) setIndex(index - 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "ArrowRight") nextStory();
      if (e.key === "ArrowLeft") prevStory();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [index, stories.length]);

  useEffect(() => {
    setStories(initialStories);
    setIndex(0);
    setMenuOpen(false);
    setCommentText("");
  }, [initialStories]);

  useEffect(() => {
    if (!story || !loggedInUser?._id) return;

    setLikes(story.likes || []);
    setComments(story.comments || []);

    const alreadyLiked = story.likes?.some(
      (u) => (u._id || u)?.toString() === loggedInUser._id.toString(),
    );

    setLiked(!!alreadyLiked);
  }, [story, loggedInUser]);

  useEffect(() => {
    if (!story) return;

    setMenuOpen(false);
    clearInterval(intervalRef.current);

    if (story.type === "video" && videoRef.current) {
      const video = videoRef.current;
      video.currentTime = 0;
      video.muted = muted;
      video.play().catch(() => {});
      setIsPlaying(true);

      const updateProgress = () => {
        if (video.duration) {
          setProgress((video.currentTime / video.duration) * 100);
        }
      };

      video.addEventListener("timeupdate", updateProgress);
      video.addEventListener("ended", nextStory);

      return () => {
        video.removeEventListener("timeupdate", updateProgress);
        video.removeEventListener("ended", nextStory);
      };
    } else {
      setProgress(0);
      let start = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const percent = Math.min((elapsed / 4000) * 100, 100);

        setProgress(percent);

        if (percent >= 100) {
          clearInterval(intervalRef.current);
          nextStory();
        }
      }, 16);
    }

    return () => clearInterval(intervalRef.current);
  }, [index, story, muted]);

  if (!Array.isArray(stories) || stories.length === 0) return null;

  const handleDelete = async (storyId) => {
    if (!onDeleteStory) return;

    setMenuOpen(false);

    await onDeleteStory(storyId);

    setStories((prev) => {
      const remaining = prev.filter((s) => s._id !== storyId);

      if (remaining.length === 0) {
        onClose();
        return [];
      }

      if (index >= remaining.length) {
        setIndex(remaining.length - 1);
      }

      return remaining;
    });
  };

  const addToHighlight = async () => {
    try {
      await fetch(`${API_URL}/api/highlights/add-story`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId: story._id,
        }),
      });

      alert("Story added to highlight");
      setMenuOpen(false);
    } catch (err) {
      console.error("Add to highlight failed", err);
      alert("Failed to add story to highlight");
    }
  };

  const handleStoryLike = async (e) => {
    e.stopPropagation();

    try {
      const res = await fetch(`${API_URL}/api/stories/${story._id}/like`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      setLiked(data.liked);
      setStories((prev) =>
        prev.map((s) =>
          s._id === story._id
            ? { ...s, likes: data.likes || [], comments: data.comments || [] }
            : s,
        ),
      );
      setLikes(data.likes || []);
      setComments(data.comments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const sendStoryComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!commentText.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/stories/${story._id}/comment`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: commentText,
        }),
      });

      const data = await res.json();

      setLikes(data.likes || []);
      setComments(data.comments || []);
      setStories((prev) =>
        prev.map((s) =>
          s._id === story._id
            ? { ...s, likes: data.likes || [], comments: data.comments || [] }
            : s,
        ),
      );
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 d-flex justify-content-center align-items-center"
      style={{
        zIndex: 2000,
        backgroundColor: "rgba(14, 12, 12, 0.95)",
        height: "100vh",
        padding: "20px 0",
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        const x = e.clientX;
        const width = window.innerWidth;
        x < width / 2 ? prevStory() : nextStory();
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: 15,
          right: 20,
          zIndex: 3000,
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          border: "none",
          fontSize: 22,
          width: 40,
          height: 40,
          borderRadius: "50%",
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      <div
        style={{
          position: "relative",
          width: "calc(100vw - 40px)",
          maxWidth: "398px",
          height: "calc(100vh - 40px)",
          backgroundColor: "#060706f1",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {story.type === "video" ? (
            <video
              key={story._id}
              ref={videoRef}
              src={getMediaUrl(story.file)}
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={getMediaUrl(story.file)}
              alt="story"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}

          <div
            style={{
              position: "absolute",
              top: 8,
              left: 10,
              right: 10,
              display: "flex",
              gap: 3,
              zIndex: 10,
            }}
          >
            {stories.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 2,
                  background: "rgba(255,255,255,0.3)",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width:
                      i < index ? "100%" : i === index ? `${progress}%` : "0%",
                    height: "100%",
                    background: "#fff",
                    transition: "width 0.1s linear",
                  }}
                />
              </div>
            ))}
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              navigate(`/profile/${story.user}`);
            }}
            style={{
              position: "absolute",
              top: 18,
              left: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              zIndex: 10,
              cursor: "pointer",
            }}
          >
            <img
              src={
                loggedInUser?.dp
                  ? getMediaUrl(loggedInUser.dp)
                  : "/default-avatar.png"
              }
              alt="user"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.6)",
              }}
            />

            <span
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {loggedInUser?.username}
            </span>
          </div>

          <div
            className="story-controls"
            style={{
              position: "absolute",
              top: 16,
              right: 10,
              display: "flex",
              gap: 8,
              zIndex: 10,
            }}
          >
            {story.type === "video" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();

                    setIsPlaying(!isPlaying);
                  }}
                  style={controlBtnStyle}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    videoRef.current.muted = !muted;
                    setMuted(!muted);
                  }}
                  style={controlBtnStyle}
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted ? "🔇" : "🔊"}
                </button>
              </>
            )}

            {story.user === loggedInUser?._id && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  style={controlBtnStyle}
                  title="More"
                >
                  ⋮
                </button>

                {menuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      top: 34,
                      right: 0,
                      width: 160,
                      background: "#222",
                      border: "1px solid #444",
                      borderRadius: 8,
                      overflow: "hidden",
                      zIndex: 9999,
                    }}
                  >
                    <div
                      onClick={() => handleDelete(story._id)}
                      style={menuItemStyle}
                    >
                      🗑️ Delete
                    </div>

                    <div onClick={addToHighlight} style={menuItemStyle}>
                      ⭐ Add to Highlight
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={sendStoryComment}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 18,
              left: 14,
              right: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              zIndex: 20,
            }}
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Reply to ${loggedInUser?.username || "user"}...`}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.7)",
                background: "rgba(0,0,0,0.25)",
                color: "#fff",
                padding: "0 16px",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={handleStoryLike}
              style={{
                background: "transparent",
                border: "none",
                color: liked ? "#ff2d75" : "#fff",
                fontSize: 30,
                cursor: "pointer",
              }}
            >
              {liked ? "♥" : "♡"}
            </button>
          </form>

          {story.user === loggedInUser?._id && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                bottom: 70,
                left: 14,
                right: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 30,
                color: "#fff",
              }}
            >
              <div
                style={{
                  background: "rgba(0,0,0,0.45)",
                  padding: "8px 12px",
                  borderRadius: 20,
                  fontWeight: 600,
                }}
              >
                ♥ {likes.length} likes
              </div>

              <div
                style={{
                  background: "rgba(0,0,0,0.45)",
                  padding: "8px 12px",
                  borderRadius: 20,
                  fontWeight: 600,
                }}
              >
                💬 {comments.length} comments
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const controlBtnStyle = {
  background: "rgba(0,0,0,0.4)",
  border: "none",
  borderRadius: "50%",
  color: "#fff",
  width: 28,
  height: 28,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: 14,
  cursor: "pointer",
};

const menuItemStyle = {
  padding: "10px 12px",
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
  borderBottom: "1px solid #333",
};
