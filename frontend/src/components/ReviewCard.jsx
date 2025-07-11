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
    <div key={review.id} className="review-card">
      <p>
        <strong>
          {review.reviewer
            ? `${review.reviewer.first_name} ${review.reviewer.last_name}`
            : "Anonymous"}
        </strong>{" "}
        - Rating: {review.rating}/5
      </p>

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

      <p>
        <em>Reviewed as: {review.reviewee_role_display}</em>
      </p>

      {isProfileSelf(review.reviewer.id) && (
        <button
          className="edit-button"
          onClick={() => navigate(`/reviews/edit/${review.id}`)}
        >
          Edit Review
        </button>
      )}
    </div>
  );
}

export default ReviewCard;
