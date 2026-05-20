import { useEffect, useState, useRef } from "react";

import axios from "axios";
import { API_URL } from "../../config";
import AddHighlightModal from "./AddHighlightModal";
import HighlightCircle from "./HighlightCircle";

export default function HighlightsBar({ userId, isOwnProfile }) {
  const [highlights, setHighlights] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchHighlights();
  }, [userId]);

  const scrollRef = useRef(null);

  const fetchHighlights = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/highlights/${userId}`, {
        withCredentials: true,
      });
      setHighlights(res.data);
    } catch (err) {
      console.error("Failed to fetch highlights", err);
    }
  };
  useEffect(() => {
    if (!scrollRef.current) return;

    // Scroll to end whenever highlights change
    scrollRef.current.scrollTo({
      left: scrollRef.current.scrollWidth,
      behavior: "smooth",
    });
  }, [highlights.length]);

  return (
    <>
      <div ref={scrollRef} className="highlight-scroll mt-4 mb-3">
        {/* ➕ ADD NEW */}
        {isOwnProfile && (
          <div
            className="highlight-item text-center"
            style={{ cursor: "pointer" }}
            onClick={() => setShowAdd(true)}
          >
            <div
              className="rounded-circle border d-flex align-items-center justify-content-center"
              style={{ width: 70, height: 70 }}
            >
              <i className="bi bi-plus fs-3"></i>
            </div>
            <small>New</small>
          </div>
        )}

        {/* EXISTING HIGHLIGHTS */}
        {highlights.map((h) => (
          <div key={h._id} className="highlight-item">
            <HighlightCircle
              highlight={h}
              isOwnProfile={isOwnProfile}
              onDeleted={fetchHighlights}
              allHighlights={highlights}
            />
          </div>
        ))}
      </div>

      {/* ✅ MODAL MUST BE HERE */}
      {showAdd && (
        <AddHighlightModal
          onClose={() => setShowAdd(false)}
          onCreated={fetchHighlights}
        />
      )}
    </>
  );
}
