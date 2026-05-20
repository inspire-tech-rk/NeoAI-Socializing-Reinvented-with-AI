import CommentItem from "./CommentItem";

export default function CommentList({
  comments,
  loading,
  onDeleted,
  onUpdated
}) {
  if (loading) return <p className="text-muted">Loading comments...</p>;

  if (!comments.length)
    return <p className="text-muted">No comments yet</p>;

  return (
    <div className="comment-list flex-grow-1 overflow-auto">
      {comments.map((comment) => (
        <CommentItem
        
          key={comment._id}
          comment={comment}
          onDeleted={onDeleted}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}
