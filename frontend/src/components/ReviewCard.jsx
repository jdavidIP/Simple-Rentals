import { useState } from "react";
import { useProfileContext } from "../contexts/ProfileContext";
import { useNavigate } from "react-router-dom";

function ReviewCard({ review }) {
  const { isProfileSelf } = useProfileContext();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded((prev) => !prev);

  const maxPreviewLength = 200;
  const comment = review.comment || "";
  const displayComment =
    comment.length > maxPreviewLength && !expanded
      ? comment.slice(0, maxPreviewLength) + "..."
      : comment;

  const rating = Number(review.rating) || 0;
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating));

  return (
    <div
      key={review.id}
      className="card my-3 shadow-sm"
      style={{ borderRadius: "12px" }}
    >
      <div className="card-body">
        {/* Header: Avatar + Name + Big Rating Badge */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-3"
              style={{
                width: 44,
                height: 44,
                fontSize: "0.95rem",
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
              {/* Star row (visual) */}
              <div
                className="d-flex align-items-center"
                aria-label={`Rated ${rating} out of 5`}
                title={`${rating}/5`}
              >
                {stars.map((filled, i) => (
                  <span
                    key={i}
                    style={{
                      color: filled ? "#ffc107" : "#e4e5e9",
                      fontSize: "1.15rem",
                      lineHeight: 1,
                      marginRight: 2,
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Prominent numeric rating */}
          <span
            className="badge text-dark"
            style={{
              background: "#ffe08a", // warm highlight like BS warning, but brighter
              border: "1px solid #ffd24d",
              fontWeight: 700,
              fontSize: "0.95rem",
              padding: "0.45rem 0.6rem",
              borderRadius: "999px",
              minWidth: 72,
              textAlign: "center",
            }}
          >
            {rating}/5
          </span>
        </div>

        {/* Comment */}
        <div className="p-3 bg-light rounded mb-2">
          <p className="mb-0">{displayComment}</p>
        </div>
        {comment.length > maxPreviewLength && (
          <button
            className="btn btn-link p-0"
            onClick={toggleExpanded}
            style={{ fontSize: "0.9rem" }}
          >
            {expanded ? "View Less" : "View More"}
          </button>
        )}

        {/* Meta + Actions */}
        <div className="d-flex align-items-center justify-content-between mt-3">
          <span className="badge bg-secondary">
            Reviewed as: {review.reviewee_role_display}
          </span>

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
    </div>
  );
}

export default ReviewCard;
