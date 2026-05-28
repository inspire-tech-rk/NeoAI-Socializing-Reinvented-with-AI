import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config";

import CreateModal from "../CreateModal";
import { useLocation } from "react-router-dom";

const getMediaUrl = (file) => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function Sidebar({ currentUser, hovered, setHovered }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [previewReel, setPreviewReel] = useState(null);

  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleAcceptFollow = async (senderId, notificationId) => {
    try {
      await axios.post(
        `${API_URL}/api/users/${senderId}/follow`,
        {},
        { withCredentials: true },
      );

      await axios.put(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        { withCredentials: true },
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true, accepted: true } : n,
        ),
      );
    } catch (err) {
      console.error("Follow back failed", err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    axios
      .get(`${API_URL}/api/notifications`, { withCredentials: true })
      .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error(err));
  }, [currentUser]);

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;

    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <div
        className="d-flex flex-column p-3 position-fixed vh-100"
        style={{
          width: hovered ? "240px" : "80px",
          background: "#000",
          color: "#fff",
          borderRight: "1px solid #2c2c2c",
          transition: "all 0.3s ease",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div>
          <h4
            className="fw-bold mb-2 d-flex align-items-center justify-content-center"
            style={{ fontSize: "1.5rem" }}
          >
            <img
              src="neoai-logo.png"
              alt="NeoAI Logo"
              style={{
                width: "40px",
                height: "40px",
                cursor: "pointer",
                objectFit: "contain",
              }}
            />

            {hovered && (
              <span style={{ marginLeft: "10px", fontSize: "1.3rem" }}>
                NeoAI
              </span>
            )}
          </h4>

          <SidebarItem
            icon="house-door-fill"
            label="Home"
            to="/"
            active={location.pathname === "/"}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            hovered={hovered}
          />
          <SidebarItem
            icon="search"
            label="Search"
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            hovered={hovered}
          />
          <SidebarItem
            icon="robot"
            label="NexAI"
            to="/nexai"
            active={location.pathname === "/nexai"}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            hovered={hovered}
          />
          <SidebarItem
            icon="film"
            label="Reels"
            to="/reels"
            active={location.pathname === "/reels"}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            hovered={hovered}
          />
          <SidebarItem
            icon="chat-dots"
            label="Messages"
            to="/messages"
            active={location.pathname === "/messages"}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            hovered={hovered}
          />

          <div style={{ position: "relative" }}>
            <div
              onClick={() => {
                setSelectedItem("Notification");
                setShowNotif(!showNotif);
              }}
            >
              <SidebarItem
                icon="bell"
                label="Notification"
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                hovered={hovered}
              />
            </div>

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "8px",
                  right: hovered ? "20px" : "8px",
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  fontSize: "12px",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div onClick={() => setIsCreateOpen(true)}>
            <SidebarItem
              icon="plus-square"
              label="Create"
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              hovered={hovered}
            />
          </div>

          <SidebarItem
            icon="speedometer2"
            label="Dashboard"
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            hovered={hovered}
          />
          <SidebarItem
            icon="person-circle"
            label="Profile"
            to="/profile"
            active={location.pathname === "/profile"}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            hovered={hovered}
          />

          <br />

          <SidebarItem
            icon="gear"
            label="Settings"
            to="/settings"
            active={location.pathname === "/settings"}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            hovered={hovered}
          />
          <SidebarItem
            icon="list"
            label="More"
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            hovered={hovered}
          />
        </div>
      </div>

      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {showNotif && (
        <div
          style={{
            position: "fixed",
            left: hovered ? "240px" : "80px",
            top: "80px",
            background: "#111",
            width: "300px",
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #2c2c2c",
            borderRadius: "8px",
            padding: "10px",
            zIndex: 1000,
          }}
        >
          {notifications.length === 0 ? (
            <p style={{ color: "#aaa" }}>No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "8px",
                  borderBottom: "1px solid #2c2c2c",
                  opacity: n.read ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    flex: 1,
                  }}
                  onClick={async (e) => {
                    if (e.target.tagName === "BUTTON") return;

                    await axios.put(
                      `${API_URL}/api/notifications/${n._id}/read`,
                      {},
                      { withCredentials: true },
                    );

                    setNotifications((prev) =>
                      prev.map((item) =>
                        item._id === n._id ? { ...item, read: true } : item,
                      ),
                    );

                    if (n.sender?._id) {
                      navigate(`/profile/${n.sender._id}`);
                    }

                    setShowNotif(false);
                  }}
                >
                  <img
                    src={
                      n.senders?.[0]?.dp || n.sender?.dp
                        ? getMediaUrl(n.senders?.[0]?.dp || n.sender?.dp)
                        : "/avatar.png"
                    }
                    onError={(e) => (e.target.src = "/avatar.png")}
                    width="35"
                    height="35"
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                    alt="sender"
                  />

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: "white", fontSize: "14px" }}>
                      <strong>
                        {n.senders?.[0]?.username || n.sender?.username}
                      </strong>
                      {n.count > 1 && (
                        <>
                          {" "}
                          and {n.count - 1} other{n.count - 1 > 1 ? "s" : ""}
                        </>
                      )}{" "}
                      {n.type === "like" && "liked your post"}
                      {n.type === "comment" && (
                        <>
                          commented:{" "}
                          <span style={{ color: "#aaa" }}>
                            "{n.commentText?.slice(0, 40)}"
                            {n.commentText?.length > 40 && "..."}
                          </span>
                        </>
                      )}
                      {n.type === "follow" && (
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <span>started following you</span>

                          {!n.accepted && (
                            <button
                              style={{
                                marginTop: "5px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                background: "#0095f6",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                width: "fit-content",
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                await handleAcceptFollow(n.sender._id, n._id);
                              }}
                            >
                              Follow Back
                            </button>
                          )}
                        </div>
                      )}
                      {n.type === "follow_accept" && (
                        <span>accepted your follow</span>
                      )}
                      {n.type === "story_like" && <span>liked your story</span>}
                      {n.type === "story_comment" && (
                        <>
                          replied to your story:{" "}
                          <span style={{ color: "#aaa" }}>
                            "{n.commentText?.slice(0, 45)}"
                            {n.commentText?.length > 45 && "..."}
                          </span>
                        </>
                      )}
                    </span>

                    <span
                      style={{
                        color: "#777",
                        fontSize: "12px",
                        marginTop: "3px",
                      }}
                    >
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                </div>

                {(n.reel?.media || n.post?.file || n.story?.file) && (
                  <>
                    {n.story?.file ? (
                      n.story.type === "video" ? (
                        <video
                          src={getMediaUrl(n.story.file)}
                          width="45"
                          height="45"
                          muted
                          playsInline
                          style={{
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      ) : (
                        <img
                          src={getMediaUrl(n.story.file)}
                          width="45"
                          height="45"
                          alt="story"
                          style={{
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      )
                    ) : n.reel?.media ? (
                      <video
                        src={getMediaUrl(n.reel.media)}
                        width="45"
                        height="45"
                        muted
                        playsInline
                        style={{
                          objectFit: "cover",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewReel({ media: n.reel.media });
                        }}
                      />
                    ) : (
                      <>
                        {n.post.file.endsWith(".mp4") ? (
                          <video
                            src={getMediaUrl(n.post.file)}
                            width="45"
                            height="45"
                            muted
                            playsInline
                            style={{
                              objectFit: "cover",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewReel({ media: n.post.file });
                            }}
                          />
                        ) : (
                          <img
                            src={getMediaUrl(n.post.file)}
                            width="45"
                            height="45"
                            alt="post"
                            style={{
                              objectFit: "cover",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewReel({ media: n.post.file });
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {previewReel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
          onClick={() => setPreviewReel(null)}
        >
          <div
            style={{
              width: "400px",
              background: "#000",
              borderRadius: "10px",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={getMediaUrl(previewReel.media)}
              controls
              autoPlay
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function SidebarItem({
  icon,
  label,
  to = "#",
  active,
  selectedItem,
  setSelectedItem,
  hovered,
}) {
  const isSelected = selectedItem === label;

  return (
    <Link
      to={to}
      className="text-decoration-none"
      onClick={() => setSelectedItem(label)}
    >
      <div
        className="d-flex align-items-center px-2 py-2 rounded sidebar-item"
        style={{
          backgroundColor: active ? "#1c1c1c" : "transparent",
          cursor: "pointer",
          color: isSelected ? "#0d6efd" : "#fff",
          transition: "background 0.2s, color 0.2s",
          borderBottom: "1px solid #2c2c2c",
          gap: hovered ? "12px" : "0px",
          justifyContent: hovered ? "flex-start" : "center",
          overflow: "hidden",
        }}
      >
        <i
          className={`bi bi-${icon}`}
          style={{
            fontSize: "1.5rem",
            color: isSelected ? "#0d6efd" : "#fff",
            flexShrink: 0,
          }}
        ></i>

        {hovered && (
          <span style={{ fontWeight: isSelected ? "600" : "400" }}>
            {label}
          </span>
        )}
      </div>
    </Link>
  );
}
