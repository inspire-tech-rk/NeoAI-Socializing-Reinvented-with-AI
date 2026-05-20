import { useState, useContext } from "react";
import PostUpload from "./post/PostUpload";
import StoryUpload from "./story/StoryUpload";
import { AuthContext } from "../context/AuthContext";
import ReelUploadModal from "./reel/ReelUploadModal";

export default function CreateModal({ isOpen, onClose }) {
  const [showPostUpload, setShowPostUpload] = useState(false);
  const { setMyPosts } = useContext(AuthContext);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [showReelUpload, setShowReelUpload] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
        style={{ zIndex: 1050 }}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className="position-fixed top-50 start-50 translate-middle bg-white rounded shadow p-3"
        style={{ width: "300px", zIndex: 1060 }}
      >
        {!showPostUpload ? (
          <>
            <h5 className="mb-3">Create</h5>
            <div className="d-flex flex-column gap-2">
              <button
                className="btn btn-light text-start"
                onClick={() => setShowPostUpload(true)}
              >
                <i className="bi bi-image me-2"></i> Post
              </button>

              <button
                className="btn btn-light text-start"
                onClick={() => setShowReelUpload(true)}
              >
                <i className="bi bi-play-circle me-2"></i> Reel
              </button>

              <button
                className="btn btn-light text-start"
                onClick={() => setShowStoryUpload(true)}
              >
                <i className="bi bi-plus-circle me-2"></i> Story
              </button>

              <button className="btn btn-light text-start">
                <i className="bi bi-camera-video me-2"></i> Live Video
              </button>
              {/* <button className="btn btn-light text-start">
                <i className="bi bi-graph-up me-2"></i> Ad
              </button>
              <button className="btn btn-light text-start">
                <i className="bi bi-puzzle me-2"></i> AI
              </button> */}
            </div>
          </>
        ) : (
          <PostUpload
            onClose={() => setShowPostUpload(false)}
            onPostCreated={(newPost) => {
              setMyPosts((prev) => [newPost, ...prev]);
              window.dispatchEvent(
                new CustomEvent("new-post-created", { detail: newPost }),
              );
            }}
          />
        )}
        {showStoryUpload && (
          <StoryUpload onClose={() => setShowStoryUpload(false)} />
        )}

        {showReelUpload && (
          <ReelUploadModal onClose={() => setShowReelUpload(false)} />
        )}
      </div>
    </>
  );
}
