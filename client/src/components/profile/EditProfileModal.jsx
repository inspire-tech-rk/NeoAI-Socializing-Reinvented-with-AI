import { useState, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { API_URL } from "../../config";

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, setUser } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [dpFile, setDpFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setPreview(`${API_URL}/${user.dp}`);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleDpChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDpFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!username.trim()) return setError("Username cannot be empty");

    const formData = new FormData();
    formData.append("username", username);
    if (dpFile) formData.append("dp", dpFile);

    try {
      setLoading(true);

      const res = await axios.put(`${API_URL}/api/users/me`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(res.data); // ✅ NOW WORKS
      setDpFile(null);
      setError("");
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
        style={{ zIndex: 1050 }}
        onClick={onClose}
      />

      <div
        className="position-fixed top-50 start-50 translate-middle bg-white rounded shadow p-4"
        style={{ width: "400px", zIndex: 1060 }}
      >
        <h5 className="mb-3">Edit Profile</h5>

        <div
          className="text-center mb-3"
          style={{ cursor: "pointer" }}
          onClick={() => fileInputRef.current.click()}
        >
          <img
            src={preview}
            className="rounded-circle"
            width="100"
            height="100"
            style={{ objectFit: "cover" }}
          />
          <div className="text-muted small mt-1">
            Click to change profile picture
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          className="d-none"
          ref={fileInputRef}
          onChange={handleDpChange}
        />

        <input
          type="text"
          className="form-control mb-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {error && <div className="text-danger mb-2">{error}</div>}

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}
