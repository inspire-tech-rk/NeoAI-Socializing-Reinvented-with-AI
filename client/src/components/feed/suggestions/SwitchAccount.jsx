import { useContext, useState } from "react";
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
  const [showModal, setShowModal] = useState(false);

  const loginAnotherAccount = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("savedAccounts");
    window.location.href = "/auth";
  };

  if (!loggedUser) return null;

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <img
            src={getMediaUrl(loggedUser.dp)}
            onError={(e) => (e.currentTarget.src = "/default-dp.png")}
            alt="dp"
            width={52}
            height={52}
            className="rounded-circle"
            style={{ objectFit: "cover" }}
          />
          <strong style={{ fontSize: 14 }}>{loggedUser.username}</strong>
        </div>

        <button
          onClick={() => setShowModal(true)}
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

      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 5000,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 360,
              background: "#fff",
              borderRadius: 12,
              zIndex: 5001,
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex justify-content-between align-items-center"
              style={{ padding: "14px 16px", borderBottom: "1px solid #ddd" }}
            >
              <strong>Switch account</strong>
              <span
                onClick={() => setShowModal(false)}
                style={{ cursor: "pointer", fontSize: 22 }}
              >
                ×
              </span>
            </div>

            <div style={{ padding: 16 }}>
              <p className="text-secondary text-center">
                No other active accounts
              </p>

              <button
                className="btn btn-outline-primary w-100 mt-2"
                onClick={loginAnotherAccount}
              >
                Login another account
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}