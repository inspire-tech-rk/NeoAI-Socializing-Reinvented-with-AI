import { API_URL } from "../../../config";

const getMediaUrl = (file) => {
  if (!file) return "/default-dp.png";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function PostHeader({ post }) {
  if (!post?.user) return null;

  return (
    <div className="d-flex align-items-center justify-content-between p-2">
      <div className="d-flex align-items-center gap-2">
        <img
          src={getMediaUrl(post.user.dp)}
          onError={(e) => (e.target.src = "/default-dp.png")}
          alt="dp"
          className="rounded-circle"
          width={40}
          height={40}
          style={{ objectFit: "cover" }}
        />

        <strong>{post.user.username || "unknown"}</strong>
      </div>

      <span style={{ cursor: "pointer" }}>⋯</span>
    </div>
  );
}