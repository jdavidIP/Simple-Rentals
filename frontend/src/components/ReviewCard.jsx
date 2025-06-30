import { useProfileContext } from "../contexts/ProfileContext";
import { useNavigate } from "react-router-dom";

function ReviewCard({ review }) {
  const { isProfileSelf } = useProfileContext();
  const navigate = useNavigate();

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
      <p>{review.comment}</p>
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
