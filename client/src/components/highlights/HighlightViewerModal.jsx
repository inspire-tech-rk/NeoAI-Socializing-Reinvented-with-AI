import { useEffect, useState, useRef } from "react";
import { API_URL } from "../../config";
import authAxios from "../../api/authAxios";

function HighlightVideo({
  src,
  muted,
  onToggleSound,
  onEnded,
  onProgress,
  paused,
}) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (paused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [paused]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => video.play().catch(() => {});
    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [src]);

  if (error) {
    return (
      <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-dark text-white">
        Video not supported
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        background: "black",
        display: "block", // 🔥 prevents inline gap
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        playsInline
        preload="metadata"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onToggleSound();
        }}
        onEnded={onEnded}
        onTimeUpdate={(e) => {
          if (paused) return; // ⏸ STOP PROGRESS WHEN PAUSED

          const video = e.currentTarget;
          if (video.duration) {
            const percent = (video.currentTime / video.duration) * 100;
            onProgress(percent);
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          background: "black",
          cursor: "pointer",
          
        }}
        onError={() => setError(true)}
      />

      {/* 🔊 TAP FOR SOUND */}
      {muted && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            color: "#fff",
            background: "rgba(0,0,0,0.5)",
            padding: "6px 10px",
            borderRadius: "20px",
            fontSize: 14,
            pointerEvents: "none",
          }}
        ></div>
      )}
    </div>
  );
}

export default function HighlightViewerModal({
  highlights,
  startHighlightId,
  isOwnProfile,
  onClose,
  onDeleted,
}) {
  const [paused, setPaused] = useState(false);

  const startIndex =
    highlights.findIndex((h) => h._id === startHighlightId) >= 0
      ? highlights.findIndex((h) => h._id === startHighlightId)
      : 0;

  const [highlightIndex, setHighlightIndex] = useState(startIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [soundOn, setSoundOn] = useState(false); // 🔊 GLOBAL SOUND

  const currentHighlight = highlights[highlightIndex];
  const items = currentHighlight.items || [];
  const currentItem = items[itemIndex];
  const [isDragging, setIsDragging] = useState(false);
  // 📱 Instagram-style long press
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  const togglePause = () => {
    setPaused((p) => !p);
  };

  /* 🔄 AUTO PROGRESS (IMAGE ONLY) */
  useEffect(() => {
    if (paused) return;

    setProgress(0);

    if (!currentItem.file.endsWith(".mp4")) {
      const interval = setInterval(() => {
        setProgress((p) => p + 1);
      }, 40);

      const timeout = setTimeout(() => nextItem(), 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [highlightIndex, itemIndex, paused, currentItem]);

  // ⌨️ KEYBOARD NAVIGATION (Instagram style)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        nextItem();
      }

      if (e.key === "ArrowLeft") {
        prevItem();
      }

      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [itemIndex, highlightIndex]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleCenterTap = () => {
    setPaused((p) => !p);
  };
  

  const nextItem = () => {
    if (itemIndex < items.length - 1) {
      setItemIndex(itemIndex + 1);
    } else if (highlightIndex < highlights.length - 1) {
      setHighlightIndex(highlightIndex + 1);
      setItemIndex(0);
    } else {
      onClose();
    }
  };

  const prevItem = () => {
    if (itemIndex > 0) {
      setItemIndex(itemIndex - 1);
    } else if (highlightIndex > 0) {
      const prev = highlights[highlightIndex - 1];
      setHighlightIndex(highlightIndex - 1);
      setItemIndex(prev.items.length - 1);
    }
  };

  const startPress = () => {
    longPressTriggered.current = false;

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setPaused(true); // ⏸ PAUSE
    }, 200);
  };

  const endPress = (direction) => {
    clearTimeout(longPressTimer.current);

    if (longPressTriggered.current) {
      setPaused(false); // ▶ RESUME
      return;
    }

    if (direction === "next") nextItem();
    if (direction === "prev") prevItem();
  };

  const deleteHighlight = async () => {
    if (!window.confirm("Delete this highlight?")) return;
    await authAxios.delete(`/highlights/${currentHighlight._id}`);
    onDeleted();
    onClose();
  };

  const onMouseDown = (e) => {
    setDragStartX(e.clientX);
    setIsDragging(true);
  };

  const onMouseUp = (e) => {
    if (dragStartX === null) return;

    const diff = e.clientX - dragStartX;

    if (diff > 60) prevItem();
    if (diff < -60) nextItem();

    setDragStartX(null);
    setIsDragging(false);
  };
  const onMouseLeave = () => {
    setIsDragging(false);
    setDragStartX(null);
  };

  if (!currentItem) return null;

    const markAsSeen = () => {
    const seen =
      JSON.parse(localStorage.getItem("seenHighlights")) || [];

    if (!seen.includes(highlight._id)) {
      localStorage.setItem(
        "seenHighlights",
        JSON.stringify([...seen, highlight._id])
      );
    }
  };
  


  return (
    <>
      {/* OVERLAY */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{ zIndex: 3000, backgroundColor: "rgba(0,0,0,0.7)" }}
        onClick={onClose}
      />

      {/* 🟢 HORIZONTAL MODAL */}
      <div
        className="position-fixed top-50 start-50 translate-middle d-flex"
        style={{
          zIndex: 3001,
          userSelect: "none",
          maxHeight: "98vh",
          overflow: "hidden", // 🔥 stop modal scroll
          
        }}
      >
        {/* ◀ LEFT PREVIEWS */}
        <div
          onWheel={(e) => e.stopPropagation()}
          style={{
            width: "140px",
            marginRight: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxHeight: "700px", // same as center
            overflowY: "auto", // 🔥 only this scrolls
            paddingRight: "4px",
          }}
        >
          {highlights
            .slice(Math.max(0, highlightIndex - 2), highlightIndex)
            .map((h) => (
                <div
                key={h._id}
                onClick={() => {
                  setHighlightIndex(
                    highlights.findIndex((x) => x._id === h._id)
                  );
                  setItemIndex(0);
                  markAsSeen(); // ✅ Mark as seen immediately
                }}
                style={{
                  height: "220px",
                  minHeight: "220px", // 🔥 prevents shrink
                  borderRadius: "10px",
                  overflow: "hidden",
                  cursor: "pointer",
                  opacity: 0.5,
                  flexShrink: 0, // 🔥 CRITICAL
                }}
              >
                <img
                  src={`${API_URL}/${h.cover}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
        </div>

        {/* 🟢 CENTER ACTIVE HIGHLIGHT (UNCHANGED LOGIC) */}
        <div
          className="d-flex flex-column"
          style={{
            marginTop: "15px",
            width: "420px",
            height: "700px",
            background: "black",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          {/* PROGRESS */}
          <div className="d-flex gap-1 px-2 pt-2">
            {items.map((_, i) => (
              <div
                key={i}
                style={{ flex: 1, height: "3px", background: "#555" }}
              >
                <div
                  style={{
                    height: "100%",
                    width:
                      i < itemIndex
                        ? "100%"
                        : i === itemIndex
                        ? `${progress}%`
                        : "0%",
                    background: "#fff",
                    transition: paused ? "none" : "width 0.1s linear",
                  }}
                />
              </div>
            ))}
          </div>

          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center px-3 py-2 text-white">
            <strong>{currentHighlight.title}</strong>
            <div className="d-flex gap-3 align-items-center">
              {currentItem.file.endsWith(".mp4") && (
                <i
                  className={`bi ${
                    soundOn ? "bi-volume-up" : "bi-volume-mute"
                  }`}
                  style={{ cursor: "pointer", fontSize: "1.2rem" }}
                  onClick={() => setSoundOn((v) => !v)}
                />
              )}

              {isOwnProfile && (
                <i
                  className="bi bi-trash"
                  style={{ cursor: "pointer" }}
                  onClick={deleteHighlight}
                />
              )}

              <i
                className="bi bi-x-lg"
                style={{ cursor: "pointer" }}
                onClick={onClose}
              />
            </div>
          </div>

          {/* CONTENT */}
          <div
            className="flex-grow-1 position-relative"
            style={{
              cursor: paused ? "grabbing" : "pointer",
              height: "100%", // 🔥 FIX
              overflow: "hidden", // 🔥 FIX
            }}
          >
            {currentItem.file.endsWith(".mp4") ? (
              <HighlightVideo
                src={`${API_URL}/${currentItem.file}`}
                muted={!soundOn}
                onToggleSound={() => setSoundOn((v) => !v)}
                onEnded={nextItem}
                onProgress={(p) => setProgress(p)}
                paused={paused}
              />
            ) : (
              <img
                src={`${API_URL}/${currentItem.file}`}
                className="w-100 h-100"
                style={{ objectFit: "contain" }}
              />
            )}
            {currentItem.file.endsWith(".mp4") ? (
              <HighlightVideo
                src={`${API_URL}/${currentItem.file}`}
                muted={!soundOn}
                onToggleSound={() => setSoundOn((v) => !v)}
                onEnded={nextItem}
                onProgress={(p) => setProgress(p)}
                paused={paused}
              />
            ) : (
              <img
                src={`${API_URL}/${currentItem.file}`}
                className="w-100 h-100"
                style={{ objectFit: "contain" }}
              />
            )}
            /* 🟢 CENTER TAP → PLAY / PAUSE (ADD THIS EXACTLY HERE) */
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleCenterTap();
              }}
              style={{
                position: "absolute",
                top: "25%",
                left: "25%",
                width: "50%",
                height: "50%",
                zIndex: 8, // above nav, below pause icon
                cursor: "pointer",
              }}
            />
            {paused && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.25)",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              />
            )}
            {/* ⏸ PAUSE ICON OVERLAY */}
            {paused && (
              <i
                className={`bi ${
                  paused ? "bi-play-circle-fill" : "bi-pause-circle-fill"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPaused((p) => !p);
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "72px",
                  color: "white",
                  opacity: paused ? 0.9 : 0.4,
                  zIndex: 20,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
              />
            )}
            {/* LEFT AREA (PREV) */}
            <div
              style={{
                position: "absolute",
                left:0,
                top: 0,
                width: "50%",
                height: "100%",
                zIndex: 5,
              }}
              onMouseDown={startPress}
              onMouseUp={() => endPress("prev")}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={startPress}
              onTouchEnd={() => endPress("prev")}
            />
            {/* RIGHT AREA (NEXT) */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "50%",
                height: "100%",
                zIndex: 5,
              }}
              onMouseDown={startPress}
              onMouseUp={() => endPress("next")}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={startPress}
              onTouchEnd={() => endPress("next")}
            />
          </div>
        </div>

        {/* ▶ RIGHT PREVIEWS */}
        <div
          onWheel={(e) => e.stopPropagation()}
          style={{
            width: "140px",
            marginRight: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxHeight: "700px", // same as center
            overflowY: "auto", // 🔥 only this scrolls
            paddingRight: "4px",
          }}
        >
          {highlights.slice(highlightIndex + 1, highlightIndex + 3).map((h) => (
            <div
              key={h._id}
              onClick={() => {
                setHighlightIndex(highlights.findIndex((x) => x._id === h._id));
                setItemIndex(0);
                markAsSeen(); // ✅ Mark as seen immediately
              }}
              style={{
                height: "220px",
                minHeight: "220px", // 🔥 prevents shrink
                borderRadius: "10px",
                overflow: "hidden",
                cursor: "pointer",
                opacity: 0.5,
                flexShrink: 0, // 🔥 CRITICAL
              }}
            >
              <img
                src={`${API_URL}/${h.cover}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
