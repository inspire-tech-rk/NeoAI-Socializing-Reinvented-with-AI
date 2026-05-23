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

  const { user: loggedInUser } = useContext(AuthContext);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

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
  }, [initialStories]);

  if (!Array.isArray(stories) || stories.length === 0) return null;

  const story = stories[index];

  const nextStory = () => {
    if (index < stories.length - 1) setIndex(index + 1);
    else onClose();
  };

  const prevStory = () => {
    if (index > 0) setIndex(index - 1);
  };

  useEffect(() => {
    if (!story) return;

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

  const handleDelete = async (storyId) => {
    if (!onDeleteStory) return;

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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(story._id);
                }}
                style={controlBtnStyle}
                title="Delete Story"
              >
                🗑️
              </button>
            )}
          </div>
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