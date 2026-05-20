import moment from "moment";

export default function PostTimestamp({ post }) {
  return (
    <div className="px-2 text-muted small">
      {moment(post.createdAt).fromNow()}
    </div>
  );
}
