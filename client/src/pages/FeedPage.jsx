import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PostCard from "../components/feed/postCard/PostCard";
import StoryBar from "../components/feed/storyBar/StoryBar";
import Suggestions from "../components/feed/suggestions/Suggestions";
import { API_URL } from "../config";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const observerRef = useRef(null);
  const initialFetchRef = useRef(false);

  // ------------------- FETCH POSTS -------------------
  const fetchPosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const res = await axios.get(
        `${API_URL}/api/posts/feed?page=${page}&limit=5`,
        { withCredentials: true },
      );

      if (!res.data || res.data.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));

          const newPosts = res.data.filter(
            (p) => p.user && !existingIds.has(p._id),
          );

          return [...prev, ...newPosts];
        });

        setPage((p) => p + 1);
      }
    } catch (err) {
      console.error("Post fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- INITIAL FETCH -------------------
  useEffect(() => {
    if (initialFetchRef.current) return;

    initialFetchRef.current = true;
    fetchPosts();
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/notifications`, { withCredentials: true })
      .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Notification fetch failed", err));
  }, []);

  // ------------------- INFINITE SCROLL -------------------
  useEffect(() => {
    if (!observerRef.current || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchPosts(),
      { threshold: 1 },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [loading, hasMore]);

  // ------------------- REAL-TIME UPDATES -------------------
  useEffect(() => {
    const handleNewPost = (e) => {
      const newPost = e.detail;

      if (newPost?.user) {
        setPosts((prev) => [newPost, ...prev]);
      }
    };

    const handleDeletedUserPosts = (e) => {
      const deletedUserId = e.detail.userId;

      setPosts((prev) => prev.filter((p) => p.user?._id !== deletedUserId));
    };

    const handleReelLikeUpdated = (e) => {
      const { reelId, reel } = e.detail;

      setPosts((prev) =>
        prev.map((p) => (p.reel?._id === reelId ? { ...p, reel } : p)),
      );
    };

    window.addEventListener("new-post-created", handleNewPost);
    window.addEventListener("user-deleted", handleDeletedUserPosts);
    window.addEventListener("reel-like-updated", handleReelLikeUpdated);

    return () => {
      window.removeEventListener("new-post-created", handleNewPost);
      window.removeEventListener("user-deleted", handleDeletedUserPosts);
      window.removeEventListener("reel-like-updated", handleReelLikeUpdated);
    };
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#0f1115",
        minHeight: "100vh",
        paddingTop: 20,
        display: "flex",
        position: "relative",
      }}
    >
      {/* ------------------- MAIN FEED (LEFT SIDE) ------------------- */}
      <div
        className="feed-main"
        style={{
          flex: 1,
          maxWidth: 600,
          width: "100%",
          paddingLeft: 16,
          paddingRight: 16,
          margin: "0 auto",
        }}
      >
        {/* MOBILE TOP HEADER */}
        <div
          className="d-flex d-md-none justify-content-between align-items-center px-3 py-2"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            background: "#0f1115",
            borderBottom: "1px solid #222",
          }}
        >
          {/* LEFT SIDE LOGO */}
          <div className="d-flex align-items-center gap-2">
            <img
              src="/neoai-logo.png"
              alt="NeoAI"
              style={{
                width: 34,
                height: 34,
                objectFit: "contain",
              }}
            />

            <span
              style={{
                color: "white",
                fontWeight: "700",
                fontSize: "22px",
                letterSpacing: "0.5px",
              }}
            >
              NeoAI
            </span>
          </div>

          {/* RIGHT SIDE NOTIFICATION */}
          <div className="position-relative text-white fs-5">
            <i
              className="bi bi-heart"
              style={{ cursor: "pointer" }}
              onClick={() => setShowNotif(!showNotif)}
            ></i>

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -10,
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  fontSize: 11,
                  width: 17,
                  height: 17,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        {showNotif && (
          <div
            className="d-md-none"
            style={{
              position: "fixed",
              top: 58,
              right: 12,
              width: 310,
              maxHeight: 420,
              overflowY: "auto",
              background: "#111",
              border: "1px solid #333",
              borderRadius: 10,
              padding: 10,
              zIndex: 5000,
              color: "white",
              boxShadow: "0 10px 35px rgba(0,0,0,0.45)",
            }}
          >
            {notifications.length === 0 ? (
              <p className="text-secondary mb-0">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={async () => {
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

                    if (n.sender?._id) navigate(`/profile/${n.sender._id}`);
                    setShowNotif(false);
                  }}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "9px 4px",
                    borderBottom: "1px solid #2c2c2c",
                    cursor: "pointer",
                    opacity: n.read ? 0.6 : 1,
                  }}
                >
                  <img
                    src={
                     (n.senders?.[0]?.dp || n.sender?.dp)
                        ? n.sender.dp.startsWith("http")
                          ? n.sender.dp
                          : `${API_URL}/${n.sender.dp.replace(/^\/+/, "")}`
                        : "/default-dp.png"
                    }
                    onError={(e) => (e.target.src = "/default-dp.png")}
                    width="36"
                    height="36"
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                    alt=""
                  />

                  <div style={{ fontSize: 13 }}>
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
                    {n.type === "comment" && `commented on your post`}
                    {n.type === "follow" && "started following you"}
                    {n.type === "follow_accept" && "accepted your follow"}
                    {n.type === "story_like" && "liked your story"}
                    {n.type === "story_comment" && "replied to your story"}
                    {n.type === "like" && "liked your post"}
                    {n.type === "comment" &&
                      `commented: ${n.commentText || ""}`}
                    {n.type === "follow" && "started following you"}
                    {n.type === "follow_accept" && "accepted your follow"}
                    {n.type === "story_like" && "liked your story"}
                    {n.type === "story_comment" &&
                      `replied to your story: ${n.commentText || ""}`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <StoryBar />

        {posts.map((post) => (
          <PostCard key={post._id} post={post} onUpdate={setPosts} />
        ))}

        {hasMore && (
          <div ref={observerRef} style={{ height: 40 }}>
            {loading && (
              <p className="text-center text-secondary">Loading...</p>
            )}
          </div>
        )}
      </div>

      {/* ------------------- SUGGESTIONS RIGHT SIDEBAR ------------------- */}
      <div
        className="suggestions-sidebar d-none d-lg-block"
        style={{
          width: 300,
          position: "fixed",
          top: 80,
          right: 120,
          padding: "0 12px",
          backgroundColor: "#fafafa",
        }}
      >
        <Suggestions />
      </div>
    </div>
  );
}
