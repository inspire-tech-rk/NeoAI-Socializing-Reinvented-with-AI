export default function MessageHeader({ selectedUser }) {
  if (!selectedUser) return null;

  const dp = selectedUser.dp
    ? `http://localhost:5000/${selectedUser.dp.replace(/\\/g, "/")}`
    : "/default-dp.png";

  return (
    <div
      className="d-flex align-items-center px-3 py-2"
      style={{ borderBottom: "1px solid #2c2c2c" }}
    >
      <div className="d-flex align-items-center gap-2">
        <img
          src={dp}
          alt=""
          style={{ width: 40, height: 40, borderRadius: "50%" }}
        />
        <strong>{selectedUser.username}</strong>
      </div>
    </div>
  );
}
