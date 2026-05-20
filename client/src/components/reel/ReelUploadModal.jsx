import { useState } from "react";
import { API_URL } from "../../config";

export default function ReelUploadModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);   // ⚡ INSTANT

    const formData = new FormData();
    formData.append("media", file);
    formData.append("caption", caption);

    try {
      await fetch(`${API_URL}/api/reels`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      window.location.reload();
    } catch (err) {
      alert("Upload failed");
      setUploading(false);
    }
  };

  return (
    <div>
      <h5 className="mb-2">Upload Reel</h5>

      <input
        type="file"
        accept="video/*,image/*"
        className="form-control mb-2"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <input
        type="text"
        placeholder="Caption..."
        className="form-control mb-2"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <div className="d-flex gap-2">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
        >
          {uploading && (
            <span className="spinner-border spinner-border-sm"></span>
          )}
          {uploading ? "Uploading" : "Upload"}
        </button>

        <button
          onClick={onClose}
          disabled={uploading}
          className="btn btn-secondary w-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
