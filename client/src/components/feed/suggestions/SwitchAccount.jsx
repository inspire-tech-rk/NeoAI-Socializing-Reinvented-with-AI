import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { API_URL } from "../../../config";

const getMediaUrl = (file) => {
  if (!file) return "/avatar.png";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function SwitchAccount() {
  const { user, currentUser } = useContext(AuthContext);
  const loggedUser = currentUser || user;

  const [showModal, setShowModal] = useState(false);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedAccounts")) || [];
    setAccounts(saved);
  }, [showModal]);

  const otherAccounts = accounts.filter(
    (acc) => acc._id !== loggedUser?._id
  );

  const updateSavedAccount = (updatedUser) => {
    const saved = JSON.parse(localStorage.getItem("savedAccounts")) || [];

    const updatedList = saved.map((acc) =>
      acc._id === updatedUser._id ? updatedUser : acc
    );

    const exists = updatedList.some((acc) => acc._id === updatedUser._id);
    if (!exists) updatedList.push(updatedUser);

    localStorage.setItem("savedAccounts", JSON.stringify(updatedList));
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const switchToAccount = async (account) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/switch`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Switch failed");
        return;
      }

      updateSavedAccount(data.user);
      window.location.href = "/";
    } catch (err) {
      console.error("Switch failed", err);
      alert("Switch failed");
    }
  };

  if (!loggedUser) return null;

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <img
            src={getMediaUrl(loggedUser.dp)}
            onError={(e) => (e.currentTarget.src = "/avatar.png")}
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
              {otherAccounts.map((acc) => (
                <div
                  key={acc._id}
                  onClick={() => switchToAccount(acc)}
                  className="d-flex align-items-center gap-3 mb-3"
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={getMediaUrl(acc.dp)}
                    onError={(e) => (e.currentTarget.src = "/avatar.png")}
                    width={50}
                    height={50}
                    className="rounded-circle"
                    style={{ objectFit: "cover" }}
                    alt="dp"
                  />

                  <div>
                    <strong>{acc.username}</strong>
                    <div className="text-secondary small">Tap to switch</div>
                  </div>
                </div>
              ))}

              <button
                className="btn btn-outline-primary w-100 mt-2"
                onClick={() => {
                  localStorage.removeItem("user");
                  window.location.href = "/auth";
                }}
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