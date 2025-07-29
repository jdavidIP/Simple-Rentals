import { useState } from "react";
import { useProfileContext } from "../contexts/ProfileContext";
import { useNavigate } from "react-router-dom";

function ReviewCard({ review }) {
  const { isProfileSelf } = useProfileContext();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded((prev) => !prev);

  const maxPreviewLength = 200; // Show first 200 chars

  const displayComment =
    review.comment.length > maxPreviewLength && !expanded
      ? review.comment.slice(0, maxPreviewLength) + "..."
      : review.comment;

  return (
    <div
      key={review.id}
      className="card my-3 shadow-sm"
      style={{ borderRadius: "10px" }}
    >
      <div className="card-body">
        {/* Reviewer Info */}
        <div className="d-flex align-items-center mb-2">
          <div
            className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-3"
            style={{
              width: "40px",
              height: "40px",
              fontSize: "0.9rem",
              fontWeight: "bold",
            }}
          >
            {review.reviewer
              ? review.reviewer.first_name.charAt(0) +
                review.reviewer.last_name.charAt(0)
              : "A"}
          </div>
          <div>
            <h6 className="mb-0">
              {review.reviewer
                ? `${review.reviewer.first_name} ${review.reviewer.last_name}`
                : "Anonymous"}
            </h6>
            <small className="text-muted">Rating: {review.rating}/5</small>
          </div>
        </div>

        {/* Comment */}

        <p>{displayComment}</p>
        {review.comment.length > maxPreviewLength && (
          <button
            className="btn btn-link p-0"
            onClick={toggleExpanded}
            style={{ fontSize: "0.9rem" }}
          >
            {expanded ? "View Less" : "View More"}
          </button>
        )}

        {/* Metadata */}
        <p className="text-muted mb-2">
          <em>Reviewed as: {review.reviewee_role_display}</em>
        </p>

        {/* Edit Button */}
        {review.reviewer && isProfileSelf(review.reviewer.id) && (
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => navigate(`/reviews/edit/${review.id}`)}
          >
            Edit Review
          </button>
        )}
      </div>
    </div>
  );
}

export default ReviewCard;
