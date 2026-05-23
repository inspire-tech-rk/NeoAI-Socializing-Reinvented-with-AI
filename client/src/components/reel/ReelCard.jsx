import { useState, useRef, useEffect } from "react";
import ReelActions from "./ReelActions";
import ReelCommentPanel from "./ReelCommentPanel";
import { API_URL } from "../../config";
import { trackView } from "../../utils/trackInteraction";

export default function ReelCard({ reel }) {
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef(null);

  const startTimeRef = useRef(null);
  const hasTrackedRef = useRef(false);
  const lastTrackedRef = useRef(0);

  const contentId = reel.content?._id || reel.content;

  const getMediaUrl = (file) => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

const mediaUrl = getMediaUrl(reel.file || reel.media);

  /* --------------------------------------------------
    🎯 INTERSECTION OBSERVER (MAIN TRACKING)
  -------------------------------------------------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTimeRef.current = Date.now();
          hasTrackedRef.current = false;
          video.play();
        } else {
          video.pause();

          if (!hasTrackedRef.current && startTimeRef.current) {
            const watchTime =
              (Date.now() - startTimeRef.current) / 1000;

            console.log("Tracking:", contentId, watchTime);

            const now = Date.now();
            if (
              now - lastTrackedRef.current > 10000 &&
              watchTime > 3
            ) {
              lastTrackedRef.current = now;

              if (contentId) {
                trackView(contentId, watchTime);
              }
            }

            hasTrackedRef.current = true;
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  /* --------------------------------------------------
    🧠 CLEANUP TRACKING (VERY IMPORTANT)
  -------------------------------------------------- */
  useEffect(() => {
    return () => {
      if (!hasTrackedRef.current && startTimeRef.current) {
        const watchTime =
          (Date.now() - startTimeRef.current) / 1000;

        console.log("Tracking (cleanup):", contentId, watchTime);

        if (watchTime > 3 && contentId) {
          trackView(contentId, watchTime);
        }
      }
    };
  }, []);

  return (
    <div className="reel-card-inner">
      <video
        ref={videoRef}
        src={mediaUrl}
        muted
        loop
        playsInline
        preload="auto"
        className="reel-media"
        onClick={(e) => (e.target.muted = !e.target.muted)}
      />

      <ReelActions post={reel} onComment={() => setShowComments(true)} />

      <div className="position-absolute bottom-0 start-0 p-2 text-white">
        <b>{reel.user?.username}</b>
        <p className="mb-0">{reel.caption}</p>
      </div>

      {showComments && (
        <ReelCommentPanel
          targetId={reel._id}
          targetType="post"
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}
