import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Settings() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const logout = async () => {
    await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    setUser(null); // clear context
    navigate("/auth");
  };

  const toggleDarkMode = () => {
    document.body.classList.toggle("dark-mode");
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Settings</h3>
      <div className="card mb-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-moon me-2"></i>
            Dark Mode
          </span>
          <button className="btn btn-outline-secondary btn-sm" onClick={toggleDarkMode}>
            Toggle
          </button>
        </div>
      </div>
      <div className="card">
        <div className="card-body d-flex justify-content-between align-items-center">
          <span className="text-danger">
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </span>
          <button className="btn btn-danger btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
