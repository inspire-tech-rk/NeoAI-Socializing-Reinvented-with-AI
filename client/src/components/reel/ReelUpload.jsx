import { useState } from "react";
import { API_URL } from "../../config";

export default function ReelUpload() {
  const [video, setVideo] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!video || uploading) return;

    setUploading(true);   // ⚡ INSTANT UI FEEDBACK

    const formData = new FormData();
    formData.append("media", video);
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
    <div className="p-3 border rounded bg-dark text-white">
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setVideo(e.target.files[0])}
        className="form-control mb-2"
      />

      <input
        type="text"
        placeholder="Caption..."
        className="form-control mb-2"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <button
        onClick={handleUpload}
        disabled={!video || uploading}
        className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
      >
        {uploading && (
          <span className="spinner-border spinner-border-sm"></span>
        )}
        {uploading ? "Uploading" : "Upload Reel"}
      </button>
    </div>
  );
}
