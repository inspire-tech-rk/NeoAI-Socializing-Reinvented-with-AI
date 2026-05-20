export default function PostHeader({ post }) {
  if (!post?.user) return null;

  return (
    <div className="d-flex align-items-center justify-content-between p-2">
      <div className="d-flex align-items-center gap-2">
        <img
          src={`http://localhost:5000/${post.user.dp || "uploads/default.png"}`}
          alt="dp"
          className="rounded-circle"
          width={40}
          height={40}
        />
        <strong>{post.user.username || "unknown"}</strong>
      </div>
      <span style={{ cursor: "pointer" }}>⋯</span>
    </div>
  );
}
