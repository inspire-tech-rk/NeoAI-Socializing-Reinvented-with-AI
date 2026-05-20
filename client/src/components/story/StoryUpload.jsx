import { useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";

export default function StoryUpload({ onClose, onStoryAdded }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!files.length) return alert("Select files");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      setLoading(true);

      await axios.post(`${API_URL}/api/stories`, formData, {
        withCredentials: true,
      });

      // 🔥 REFRESH STORY BAR IMMEDIATELY
      if (onStoryAdded) await onStoryAdded();

      onClose();
    } catch (err) {
      alert("Story upload failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5>Add Story</h5>

      <input
        type="file"
        className="form-control my-3"
        multiple
        accept="image/*,video/*"
        onChange={(e) => setFiles([...e.target.files])}
      />

      <button
        className="btn btn-primary w-100"
        disabled={loading}
        onClick={handleUpload}
      >
        {loading ? "Uploading..." : "Upload Story"}
      </button>
    </div>
  );
}
