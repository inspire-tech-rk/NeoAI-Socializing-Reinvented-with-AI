export default function PostMedia({ post }) {
  const media = post?.file || post?.img || "";
  if (!media) return null;

  const mediaUrl = media.startsWith("http")
    ? media
    : `http://localhost:5000/${media.startsWith("/") ? media.slice(1) : media}`;

  const isVideo =
    post?.type === "reel" ||
    post?.type === "video" ||
    /\.(mp4|webm|mov|mkv)$/i.test(media);

  return (
    <div
      className="bg-black d-flex justify-content-center align-items-center"
      style={{
        width: "100%",
        maxHeight: "650px",
        overflow: "hidden",
      }}
    >
      {isVideo ? (
        <video
          src={mediaUrl}
          controls
          playsInline
          preload="metadata"
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "650px",
            objectFit: "contain",
          }}
        />
      ) : (
        <img
          src={mediaUrl}
          alt="post"
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "650px",
            objectFit: "contain",
          }}
        />
      )}
    </div>
  );
}
