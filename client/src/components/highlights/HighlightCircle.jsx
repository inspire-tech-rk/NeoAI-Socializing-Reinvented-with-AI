import { useState } from "react";
import { API_URL } from "../../config";
import HighlightViewerModal from "./HighlightViewerModal";

const getMediaUrl = (file) => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function HighlightCircle({
  highlight,
  isOwnProfile,
  onDeleted,
  allHighlights,
}) {
  const [showViewer, setShowViewer] = useState(false);

  const cover = highlight.items?.[0]?.file;

  const seenHighlights =
    JSON.parse(localStorage.getItem("seenHighlights")) || [];

  const isSeen = seenHighlights.includes(highlight._id);

  return (
    <>
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
              ? "#ccc"
              : "linear-gradient(45deg, #ff0066, #ffcc00)",
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
                src={getMediaUrl(cover)}
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
                src={getMediaUrl(cover)}
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

      {showViewer && (
        <HighlightViewerModal
          highlights={allHighlights}
          startHighlightId={highlight._id}
          isOwnProfile={isOwnProfile}
          onClose={() => setShowViewer(false)}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}