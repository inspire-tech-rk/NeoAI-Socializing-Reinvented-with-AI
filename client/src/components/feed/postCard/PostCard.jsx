import { useState, useContext, useEffect } from "react"; // ✅ ADD useEffect
import { AuthContext } from "../../../context/AuthContext";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostAction from "./PostAction";
import PostMeta from "./PostMeta";
import PostTimestamp from "./PostTimestamp";
import CommentBox from "../../comment/CommentBox";

export default function PostCard({ post, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const { user } = useContext(AuthContext);

  return (
    <>
      <div
        id={post._id} // ✅ ADD HERE (VERY IMPORTANT)
        className="border rounded mb-4 bg-white post-card-mobile"
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <PostHeader post={post} />
        <PostMedia post={post} />
        <PostAction
          post={post}
          onCommentClick={() => setShowComments(true)}
          onUpdate={onUpdate}
        />
        <PostMeta post={post} />
        <PostTimestamp post={post} />
      </div>

      {showComments && (
        <>
          <div
            onClick={() => setShowComments(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 999,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "420px",
              height: "100vh",
              background: "#111",
              color: "white",
              zIndex: 1000,
              padding: "20px",
              boxShadow: "-5px 0 15px rgba(0,0,0,0.3)",
              overflowY: "auto",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            <CommentBox targetId={post._id} targetType="post" />
          </div>
        </>
      )}
    </>
  );
}
