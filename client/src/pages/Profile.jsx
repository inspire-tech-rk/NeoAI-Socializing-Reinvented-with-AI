import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import EditProfileModal from "../components/profile/EditProfileModal";
import PostPreviewModal from "../components/post/PostPreviewModal";
import axios from "axios";
import { API_URL } from "../config";
import HighlightsBar from "../components/highlights/HighlightsBar";
import { useParams, useNavigate } from "react-router-dom";
import StoryRing from "../components/story/StoryRing";
import StoryViewer from "../components/story/StoryViewer";

const getMediaUrl = (file) => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

// ---------------- PostCard Component ----------------
function PostCard({ post, onDelete, onSelect }) {
  const mediaUrl = getMediaUrl(post.file);

  const isVideo =
    post.type === "video" ||
    post.type === "reel" ||
    /\.(mp4|webm|mov|mkv)$/i.test(post.file || "");

  return (
    <div className="col-6 col-xl-4">
      <div className="position-relative">
        {isVideo ? (
          <video
            preload="metadata"
            muted
            controls
            playsInline
            className="w-100 rounded"
            style={{ height: "220px", objectFit: "cover" }}
            onClick={() => onSelect({ ...post, video: mediaUrl })}
          >
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={mediaUrl}
            className="w-100 rounded"
            style={{ height: "220px", objectFit: "cover" }}
            alt="post"
            onClick={() => onSelect({ ...post, image: mediaUrl })}
          />
        )}

        <div className="position-absolute bottom-0 start-0 w-100 px-2 py-1 bg-dark bg-opacity-50 text-white">
          <span>Posts</span>
        </div>

        <i
          className="bi bi-trash position-absolute top-0 end-0 m-2 text-white"
          onClick={() => onDelete(post._id)}
        ></i>
      </div>
    </div>
  );
}

// ---------------- RightSlidePanel Component ----------------
function RightSlidePanel({
  title,
  users,
  onClose,
  onUserRemoved,
  onUserClick,
}) {
  const [search, setSearch] = useState("");
  const [localUsers, setLocalUsers] = useState(
    (users || []).map((u) => ({ ...u, followStatus: "following" })),
  );

  useEffect(() => {
    setLocalUsers(
      (users || []).map((u) => ({ ...u, followStatus: "following" })),
    );
  }, [users]);

  const filteredUsers = localUsers.filter((u) =>
    u?.username?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAction = async (targetUserId) => {
    try {
      if (title === "Following") {
        await axios.post(
          `${API_URL}/api/users/${targetUserId}/follow`,
          {},
          { withCredentials: true },
        );

        setLocalUsers((prev) =>
          prev.map((u) =>
            u._id === targetUserId
              ? {
                  ...u,
                  followStatus:
                    u.followStatus === "following" ? "follow" : "following",
                }
              : u,
          ),
        );

        onUserRemoved?.(title, targetUserId);
      } else {
        await axios.post(
          `${API_URL}/api/users/${targetUserId}/remove-follower`,
          {},
          { withCredentials: true },
        );

        setLocalUsers((prev) => prev.filter((u) => u._id !== targetUserId));
        onUserRemoved?.(title, targetUserId);
      }
    } catch (err) {
      console.error("Follow/remove action failed", err);
      alert("Action failed");
    }
  };

  return (
    <>
      <div className="right-panel-backdrop" onClick={onClose} />

      <div
        className="position-fixed top-0 end-0 h-100 bg-white shadow"
        style={{
          width: "390px",
          zIndex: 3000,
          overflowY: "auto",
        }}
      >
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h5 className="m-0">{title}</h5>
          <i
            className="bi bi-x-lg"
            style={{ cursor: "pointer", fontSize: 22 }}
            onClick={onClose}
          />
        </div>

        <div className="p-3">
          <input
            className="form-control mb-3"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filteredUsers.length === 0 ? (
            <p className="text-secondary text-center mt-3">No users</p>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u._id}
                className="d-flex align-items-center justify-content-between mb-3"
              >
                <div
                  className="d-flex align-items-center gap-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => onUserClick(u._id)}
                >
                  <img
                    src={u.dp ? getMediaUrl(u.dp) : "/default-dp.png"}
                    onError={(e) => (e.target.src = "/default-dp.png")}
                    className="rounded-circle"
                    width={52}
                    height={52}
                    alt=""
                    style={{
                      objectFit: "cover",
                      border: "1px solid #ddd",
                    }}
                  />

                  <div>
                    <div style={{ fontWeight: 600 }}>{u.username}</div>
                    <small className="text-secondary">@{u.username}</small>
                  </div>
                </div>

                <button
                  className="btn btn-light btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(u._id);
                  }}
                >
                  {title === "Followers"
                    ? "Remove"
                    : u.followStatus === "following"
                      ? "Following"
                      : "Follow"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ---------------- Profile Component ----------------
export default function Profile() {
  const { user: loggedInUser, loading } = useContext(AuthContext);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showStory, setShowStory] = useState(false);
  const [hasStory, setHasStory] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [profilePosts, setProfilePosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const { userId } = useParams();
  const navigate = useNavigate();

  // ---------------- PROFILE LOAD ----------------
  useEffect(() => {
    if (!loggedInUser) return;

    const fetchUserProfile = async () => {
      try {
        const idToFetch = userId ? userId : loggedInUser._id;

        const res = await axios.get(`${API_URL}/api/users/${idToFetch}`, {
          withCredentials: true,
        });

        setProfileUser(res.data);
      } catch (err) {
        console.error("Profile load failed:", err);
      }
    };

    fetchUserProfile();
  }, [userId, loggedInUser]);

  // ---------------- CHECK FOLLOW STATUS ----------------
  useEffect(() => {
    if (!loggedInUser || !profileUser) return;

    const followingIds =
      loggedInUser.following?.map((id) =>
        typeof id === "object" ? id._id : id,
      ) || [];

    setIsFollowing(followingIds.includes(profileUser._id));
  }, [loggedInUser, profileUser]);

  // ---------------- LOAD POSTS ----------------
  useEffect(() => {
    if (!profileUser?._id) return;

    const loadPosts = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/posts/user/${profileUser._id}`,
          {
            withCredentials: true,
          },
        );
        setProfilePosts(res.data);
      } catch (err) {
        console.error("Failed loading profile posts", err);
      }
    };

    loadPosts();
  }, [profileUser]);

  // ---------------- STORY CHECK ----------------
  useEffect(() => {
    if (!profileUser) return;

    axios
      .get(`${API_URL}/api/stories/has/${profileUser._id}`, {
        withCredentials: true,
      })
      .then((res) => setHasStory(res.data.hasStory))
      .catch((err) => console.error("Story check failed:", err));
  }, [profileUser]);

  // ---------------- NEW POST LISTENER ----------------
  useEffect(() => {
    const handler = (e) => {
      const newPost = e.detail;

      if (newPost?.user?._id === profileUser?._id) {
        setProfilePosts((prev) => [newPost, ...prev]);
      }
    };

    window.addEventListener("new-post-created", handler);
    return () => window.removeEventListener("new-post-created", handler);
  }, [profileUser]);

  // ---------------- DELETE POST ----------------
  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;

    await axios.delete(`${API_URL}/api/posts/${postId}`, {
      withCredentials: true,
    });

    setProfilePosts((prev) => prev.filter((p) => p._id !== postId));
  };

  // ---------------- LOADING STATE ----------------
  if (loading || !profileUser)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  // ---------------- STORY OPEN ----------------
  const openStory = async () => {
    if (stories.length) return setShowStory(true);

    const res = await axios.get(`${API_URL}/api/stories/${profileUser._id}`, {
      withCredentials: true,
    });

    if (res.data?.length) {
      setStories(res.data);
      setShowStory(true);
    }
  };

  const handleFollowAction = async (userId) => {
    try {
      await axios.post(
        `${API_URL}/api/users/${userId}/follow`,
        {},
        { withCredentials: true },
      );

      window.location.reload();
    } catch (err) {
      console.error("Follow action failed", err);
    }
  };

  const handleUserRemovedFromList = (type, userId) => {
    setProfileUser((prev) => {
      if (!prev) return prev;

      if (type === "Followers") {
        return {
          ...prev,
          followers: prev.followers.filter((u) => u._id !== userId),
        };
      }

      return prev;
    });
  };

  const openUserProfile = (id) => {
    setShowFollowersModal(false);
    setShowFollowingModal(false);
    navigate(`/profile/${id}`);
  };

  return (
    <div
      className="container-fluid"
      style={{
        background: "#0f1115",
        minHeight: "100vh",
        padding: "20px 24px",
      }}
    >
      <div className="row gx-4">
        {/* ---------------- POSTS CENTER ---------------- */}
        <div className="col-12 col-lg-9 col-xl-8">
          <div
            className="card rounded-4 p-3 posts-container"
            style={{ maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}
          >
            <h6 className="mb-3">Posts</h6>

            <div className="row g-3">
              {profilePosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onDelete={handleDelete}
                  onSelect={setSelectedPost}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ---------------- PROFILE SIDEBAR ---------------- */}
        <div className="col-12 col-lg-7 col-xl-4">
          <div
            className="card bg-dark text-white rounded-4 p-4 text-center sidebar"
            style={{ position: "sticky", top: "20px" }}
          >
            {/* PROFILE DP */}
            <div onClick={openStory} style={{ cursor: "pointer" }}>
              <img
                src={
                  profileUser.dp
                    ? getMediaUrl(profileUser.dp)
                    : "/default-dp.png"
                }
                onError={(e) => (e.target.src = "/default-dp.png")}
                className="rounded-circle"
                width={150}
                height={150}
                style={{
                  objectFit: "cover",
                  marginBottom: "10px",
                  background: hasStory
                    ? "linear-gradient(45deg, #feda75, #d62976, #962fbf)"
                    : "transparent",
                  padding: hasStory ? "3px" : "0",
                }}
                alt=""
              />
            </div>

            <h5 className="mt-3">@{profileUser.username}</h5>
            <br />

            {/* FOLLOW BUTTON */}
            {loggedInUser._id !== profileUser._id && (
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={async () => {
                  try {
                    const res = await axios.post(
                      `${API_URL}/api/users/${profileUser._id}/follow`,
                      {},
                      { withCredentials: true },
                    );

                    if (res.data.requested) {
                      alert("Follow request sent");
                    }

                    setIsFollowing(res.data.following);
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}

            {/* ---------------- FOLLOW STATS ---------------- */}
            <div className="d-flex justify-content-around my-3">
              <div>
                <strong>{profilePosts.length}</strong>
                <div>Posts</div>
              </div>

              <div
                style={{ cursor: "pointer" }}
                onClick={() => setShowFollowersModal(true)}
              >
                <strong>{profileUser.followers?.length || 0}</strong>
                <div>Followers</div>
              </div>

              <div
                style={{ cursor: "pointer" }}
                onClick={() => setShowFollowingModal(true)}
              >
                <strong>{profileUser.following?.length || 0}</strong>
                <div>Following</div>
              </div>
            </div>

            <button
              className="btn btn-outline-light btn-sm mb-3"
              onClick={() => setEditOpen(true)}
            >
              Edit Profile
            </button>

            {/* ---------------- HIGHLIGHTS ---------------- */}
            <h6 className="text-start mt-4">HIGHLIGHTS</h6>
            <HighlightsBar userId={profileUser._id} isOwnProfile />
          </div>
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}
      {showStory && (
        <StoryViewer stories={stories} onClose={() => setShowStory(false)} />
      )}

      <EditProfileModal isOpen={editOpen} onClose={() => setEditOpen(false)} />

      {selectedPost && (
        <PostPreviewModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      <RightSlidePanel
        title="Followers"
        users={profileUser.followers || []}
        onClose={() => setShowFollowersModal(false)}
        onUserRemoved={handleUserRemovedFromList}
        onUserClick={openUserProfile}
      />

      <RightSlidePanel
        title="Following"
        users={profileUser.following || []}
        onClose={() => setShowFollowingModal(false)}
        onUserRemoved={handleUserRemovedFromList}
        onUserClick={openUserProfile}
      />
    </div>
  );
}
