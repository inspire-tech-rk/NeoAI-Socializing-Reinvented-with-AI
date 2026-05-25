import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { API_URL } from "../../../config";

const getMediaUrl = (file) => {
  if (!file) return "/default-dp.png";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function SwitchAccount() {
  const { user, currentUser } = useContext(AuthContext);
  const loggedUser = currentUser || user;

  const handleSwitch = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (!loggedUser) return null;

  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      <div className="d-flex align-items-center gap-2">
        <img
          src={getMediaUrl(loggedUser.dp)}
          onError={(e) => (e.target.src = "/default-dp.png")}
          alt="dp"
          width={52}
          height={52}
          className="rounded-circle"
          style={{ objectFit: "cover" }}
        />

        <strong style={{ fontSize: 14 }}>{loggedUser.username}</strong>
      </div>

      <button
        onClick={handleSwitch}
        style={{
          background: "none",
          border: "none",
          color: "#0095f6",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Switch
      </button>
    </div>
  );
}