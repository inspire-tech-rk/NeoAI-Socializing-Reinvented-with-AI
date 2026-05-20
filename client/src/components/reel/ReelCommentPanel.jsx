import { useEffect } from "react";
import CommentBox from "../comment/CommentBox";

export default function ReelCommentPanel({ targetId, targetType, onClose })
{
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  return (
    <div className="reel-comment-panel">
      <div className="d-flex justify-content-between align-items-center border-bottom p-2">
        <b>Comments</b>
        <span style={{ cursor: "pointer" }} onClick={onClose}>✖</span>
      </div>

      <div className="flex-grow-1 overflow-auto p-2">
       <CommentBox targetId={targetId} targetType={targetType} />

      </div>
    </div>
  );
}
