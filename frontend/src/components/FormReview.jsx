import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/forms.css";

function FormReview({ method, review }) {
  const { id: revieweeId } = useParams();
  const navigate = useNavigate();

  // Initialize state with review data if editing, otherwise defaults
  const [rating, setRating] = useState(review?.rating || 5);
  const [comment, setComment] = useState(review?.comment || "");
  const [revieweeRole, setRevieweeRole] = useState(
    review?.reviewee_role || "T"
  );
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (method === "edit" && review) {
      setRating(review.rating);
      setComment(review.comment);
      setRevieweeRole(review.reviewee_role);
    }
  }, [method, review]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    try {
      if (method === "edit" && review) {
        // PATCH to update the review
        await api.patch(`/reviews/manage/${review.id}`, {
          rating,
          comment,
          reviewee_role: revieweeRole,
        });
        navigate(`/profile/${review.reviewee.id}`);
      } else {
        // POST to create a new review
        const response = await api.post(`/profile/reviews/${revieweeId}`, {
          rating,
          comment,
          reviewee_role: revieweeRole,
          reviewee: revieweeId,
        });
        navigate(`/profile/${revieweeId}`);
      }
    } catch (error) {
      if (error.response?.data) {
        const errorList = Object.values(error.response.data).flat();
        setErrors(errorList);
      } else {
        setErrors(["An error occurred while submitting the review."]);
      }
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    if (
      !window.confirm(
        "Are you sure you want to delete this review? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/reviews/manage/${review.id}`);
      navigate(`/profile/${review.reviewee.id}`);
    } catch (error) {
      if (error.response?.data) {
        const errorList = Object.values(error.response.data).flat();
        setErrors(errorList);
      } else {
        setErrors(["An error occurred while submitting the review."]);
      }
    }
  };

  return (
    <div className="form-container">
      <h1>{method === "edit" ? "Edit Review" : "Leave a Review"}</h1>
      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <ul>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        )}

        <label htmlFor="rating">Rating (1–5)</label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(parseInt(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>

        <label htmlFor="revieweeRole">Role of Reviewee</label>
        <select
          id="revieweeRole"
          value={revieweeRole}
          onChange={(e) => setRevieweeRole(e.target.value)}
        >
          <option value="T">Tenant</option>
          <option value="L">Landlord</option>
          <option value="R">Roommate</option>
        </select>

        <label htmlFor="comment">Comment</label>
        <textarea
          id="comment"
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your feedback here..."
        />

        <button type="submit">
          {method === "edit" ? "Save Changes" : "Submit Review"}
        </button>
        {method === "edit" && (
          <button
            type="delete"
            className="btn btn-danger"
            onClick={handleDelete}
          >
            Delete Review
          </button>
        )}
      </form>
    </div>
  );
}

export default FormReview;
