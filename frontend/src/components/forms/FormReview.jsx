import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import "../../styles/forms.css";

function FormReview({ method, review }) {
  const { id: revieweeId } = useParams();
  const navigate = useNavigate();

  // Initialize state with review data if editing, otherwise defaults
  const [rating, setRating] = useState(review?.rating || 5);
  const [comment, setComment] = useState(review?.comment || "");
  const [revieweeRole, setRevieweeRole] = useState(
    review?.reviewee_role[0] || "T"
  );
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (method === "edit" && review) {
      setRating(review.rating);
      setComment(review.comment);
      setRevieweeRole(review.reviewee_role);
    }
  }, [method, review]);

  function validateFields({ rating, comment, reviewee_role }) {
    const errors = {};
    if (!rating || rating < 1 || rating > 5)
      errors.rating = "Rating must be between 1 and 5.";
    if (!comment || comment.trim().length < 10)
      errors.comment = "Comment must be at least 10 characters.";
    if (!["T", "L", "R"].includes(reviewee_role))
      errors.reviewee_role = "Select a valid role.";
    if (comment.length > 1000)
      errors.comment = "Comment cannot exceed 1,000 characters.";
    return errors;
  }

  const handleChange = (field, value) => {
    if (field === "rating") setRating(value);
    else if (field === "comment") setComment(value);
    else if (field === "reviewee_role") setRevieweeRole(value);

    const data = {
      rating: field === "rating" ? value : rating,
      comment: field === "comment" ? value : comment,
      reviewee_role: field === "reviewee_role" ? value : revieweeRole,
    };
    setFieldErrors(validateFields(data));
  };

  const handleDelete = async () => {
    try {
      await api.delete(`reviews/manage/${review.id}`);
      navigate(`/profile/${review.reviewee.id}`);
    } catch (err) {
      errors.delete = "Error deleting review";
      console.error("Failed to delete review.", err);
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const errMsg = (name) =>
    touched[name] && fieldErrors[name] ? (
      <div className="field-error">{fieldErrors[name]}</div>
    ) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setTouched({ rating: true, comment: true, reviewee_role: true });

    const validationErrors = validateFields({
      rating,
      comment,
      reviewee_role: revieweeRole,
    });
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

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

  return (
    <div className="form-container">
      <h1>{method === "edit" ? "Edit Review" : "Leave a Review"}</h1>
      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <ul className="error-list">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        )}

        <label htmlFor="rating">Rating (1–5)</label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => handleChange("rating", parseInt(e.target.value))}
          onBlur={() => handleBlur("rating")}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
        {errMsg("rating")}

        <label htmlFor="revieweeRole">Role of Reviewee</label>
        <select
          id="revieweeRole"
          value={revieweeRole}
          onChange={(e) => handleChange("reviewee_role", e.target.value)}
          onBlur={() => handleBlur("reviewee_role")}
        >
          <option value="T">Tenant</option>
          <option value="L">Landlord</option>
          <option value="R">Roommate</option>
        </select>
        {errMsg("reviewee_role")}

        <label htmlFor="comment">Comment</label>
        <textarea
          id="comment"
          maxLength="1000"
          rows="4"
          value={comment}
          onChange={(e) => handleChange("comment", e.target.value)}
          onBlur={() => handleBlur("comment")}
          placeholder="Write your feedback here..."
        />
        {errMsg("comment")}

        <button type="submit" className="btn btn-primary">
          {method === "edit" ? "Save Changes" : "Submit Review"}
        </button>
        {method === "edit" && (
          <button
            type="button"
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
