export default function PostMeta({ post }) {
  return (
    <div className="px-2">
      {/* Likes removed */}
      <p className="mb-1">
        <strong>{post.user.username}</strong> {post.caption}
      </p>
    </div>
  );
}
