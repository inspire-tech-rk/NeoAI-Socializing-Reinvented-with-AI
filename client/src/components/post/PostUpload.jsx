import { useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../../config";


export default function PostUpload({ onClose, onPostCreated }) {

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");

    const data = new FormData();
    data.append("file", file);
    data.append("caption", caption);

    try {
      setLoading(true);

      // Upload post
      const res = await axios.post(`${API_URL}/api/posts`, data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });

      // 🔥 NEW: Notify parent (CreateModal) about new post
      if (onPostCreated) {
        onPostCreated(res.data);
      }

      alert("Post uploaded!");
      onClose();
    } catch (err) {
      alert("Upload failed");
      console.error(err);
    } finally {
      setLoading(false);
      setProgress(0);
      setFile(null);
      setPreview(null);
      setCaption("");
    }
  };

  return (
    <div>
      <h5 className="mb-3 text-center">Create new post</h5>

      {/* Drag & Drop / Preview */}
      <div
        className="border rounded p-4 mb-3 d-flex justify-content-center align-items-center"
        style={{
          height: "300px",
          cursor: "pointer",
          backgroundColor: "#f8f8f8",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => {
          if (!preview) fileInputRef.current.click();
        }}
      >
        {preview ? (
          file.type.startsWith("video") ? (
            <video
              src={preview}
              controls
              className="w-100 h-100 object-fit-contain"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-100 h-100 object-fit-contain"
            />
          )
        ) : (
          <div className="text-center text-muted">
            <i className="bi bi-image fs-1"></i>
            <p>Drag photos and videos here</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current.click();
              }}
            >
              Select from Computer
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*,video/*"
          className="d-none"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {/* Caption */}
      <textarea
        className="form-control mb-2"
        placeholder="Write a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      {/* Progress Bar */}
      {loading && (
        <div className="progress mb-2">
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading || !file}
          onClick={handleSubmit}
        >
          {loading ? "Uploading..." : "Post"}
        </button>
      </div>
    </div>
  );
}
