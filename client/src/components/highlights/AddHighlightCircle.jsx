import { useState } from "react";
import { API_URL } from "../../config";
import HighlightViewerModal from "./HighlightViewerModal";

export default function HighlightCircle({ highlight, isOwnProfile, onDeleted }) {
  const [open, setOpen] = useState(false);

  // Cover image = first story
  const cover = highlight.items?.[0]?.file;

  return (
    <>
      {/* 🟡 CIRCLE */}
      <div
        className="text-center"
        style={{ cursor: "pointer", width: 80 }}
        onClick={() => setOpen(true)}
      >
        <div
          className="rounded-circle border d-flex align-items-center justify-content-center mx-auto"
          style={{
            width: 70,
            height: 70,
            overflow: "hidden",
          }}
        >
          {cover ? (
            <img
              src={`${API_URL}/${cover}`}
              alt="highlight"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <i className="bi bi-image text-muted"></i>
          )}
        </div>

        <small className="d-block mt-1 text-truncate">
          {highlight.title}
        </small>
      </div>

      {/* 🔍 VIEWER */}
      {open && (
        <HighlightViewerModal
          highlight={highlight}
          isOwnProfile={isOwnProfile}
          onClose={() => setOpen(false)}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
