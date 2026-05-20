export default function SuggestionHeader() {
  return (
    <div
      className="d-flex justify-content-between align-items-center mb-3"
      style={{ fontSize: 14 }}
    >
      <strong>Suggestions For You</strong>
      <a
        href="#"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#0095f6",
          textDecoration: "none",
        }}
      >
        See All
      </a>
    </div>
  );
}
