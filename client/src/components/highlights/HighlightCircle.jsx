import { useState } from "react";
import { API_URL } from "../../config";
import HighlightViewerModal from "./HighlightViewerModal";

export default function HighlightCircle({
  highlight,
  isOwnProfile,
  onDeleted,
  allHighlights,
}) {
  const [showViewer, setShowViewer] = useState(false);

  // Cover image = first item of this highlight
  const cover = highlight.items?.[0]?.file;

  // 🔴 Seen / Unseen logic (Instagram style)
  const seenHighlights =
    JSON.parse(localStorage.getItem("seenHighlights")) || [];

  const isSeen = seenHighlights.includes(highlight._id);

  return (
    <>
      {/* 🟡 CIRCLE */}
      <div
        className="text-center"
        style={{ cursor: "pointer", width: 80 }}
        onClick={() => setShowViewer(true)}
      >
        <div
          className="mx-auto"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            padding: 2,
            background: isSeen
              ? "#ccc" // ⚪ seen
              : "linear-gradient(45deg, #ff0066, #ffcc00)", // 🔴 unseen
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              overflow: "hidden",
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cover?.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={`${API_URL}/${cover}`}
                muted
                loop
                playsInline
                preload="metadata"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <img
                src={`${API_URL}/${cover}`}
                alt="highlight"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        </div>

        <small className="d-block mt-1 text-truncate">{highlight.title}</small>
      </div>

      {/* 🔍 VIEWER - opens all highlights starting from this one */}
      {showViewer && (
        <HighlightViewerModal
          highlights={allHighlights} // pass all highlights of the user
          startHighlightId={highlight._id} // pass clicked highlight
          isOwnProfile={isOwnProfile}
          onClose={() => setShowViewer(false)}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
