import { useEffect, useRef, useState } from "react";
import axios from "axios";
import PostCard from "../components/feed/postCard/PostCard";
import StoryBar from "../components/feed/storyBar/StoryBar";
import Suggestions from "../components/feed/suggestions/Suggestions";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const observerRef = useRef(null);
  const initialFetchRef = useRef(false);

  // ------------------- FETCH POSTS -------------------
  const fetchPosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/posts/feed?page=${page}&limit=5`,
        { withCredentials: true }
      );

      if (!res.data || res.data.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));

          const newPosts = res.data.filter(
            (p) => p.user && !existingIds.has(p._id)
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

  // ------------------- INFINITE SCROLL -------------------
  useEffect(() => {
    if (!observerRef.current || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchPosts(),
      { threshold: 1 }
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

      setPosts((prev) =>
        prev.filter((p) => p.user?._id !== deletedUserId)
      );
    };

    const handleReelLikeUpdated = (e) => {
      const { reelId, reel } = e.detail;

      setPosts((prev) =>
        prev.map((p) =>
          p.reel?._id === reelId ? { ...p, reel } : p
        )
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
        style={{
          flex: 1,
          maxWidth: 600,
          minWidth: 400,
          paddingLeft: 60,
          paddingRight: 40,
          marginLeft: 120,
        }}
      >
        <StoryBar />

        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onUpdate={setPosts}
          />
        ))}

        {hasMore && (
          <div ref={observerRef} style={{ height: 40 }}>
            {loading && (
              <p className="text-center text-secondary">
                Loading...
              </p>
            )}
          </div>
        )}
      </div>

      {/* ------------------- SUGGESTIONS RIGHT SIDEBAR ------------------- */}
      <div
        className="d-none d-lg-block"
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
