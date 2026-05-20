import { API_URL } from "../../config";

export default function StoryRing({ user, hasStory, onClick }) {
  const imageSrc = user?.dp
    ? user.dp.startsWith("http")
      ? user.dp
      : `${API_URL}/${user.dp}`
    : "/default-dp.png";

  return (
    <div
      onClick={onClick}
      style={{
        width: 76,
        height: 76,
        borderRadius: "50%",
        padding: hasStory ? "3px" : "0",
        background: hasStory
          ? "linear-gradient(45deg, #feda75, #d62976, #962fbf)"
          : "transparent",
        cursor: "pointer",
        display: "inline-block",
      }}
    >
      <img
        src={imageSrc}
        onError={(e) => (e.target.src = "/default-dp.png")}
        className="rounded-circle"
        width="100%"
        height="100%"
        style={{ objectFit: "cover" }}
        alt=""
      />
    </div>
  );
}
