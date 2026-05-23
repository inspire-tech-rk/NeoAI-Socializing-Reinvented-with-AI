import { API_URL } from "../../config";

const getMediaUrl = (file) => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_URL}/${file.replace(/^\/+/, "")}`;
};

export default function ChatUserItem({ user, onClick }) {
  const dp = user.dp ? getMediaUrl(user.dp.replace(/\\/g, "/")) : "/default-dp.png";

  return (
    <div
      className="d-flex align-items-center gap-3 p-2 rounded mb-2"
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      <img
        src={dp}
        alt="dp"
        style={{
          width: "45px",
          height: "45px",
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
      <span>{user.username}</span>
    </div>
  );
}