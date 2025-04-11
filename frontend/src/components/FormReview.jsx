import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/forms.css";

function FormReview() {
  const { id: revieweeId } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [revieweeRole, setRevieweeRole] = useState("T"); // Default to Tenant
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    try {
      const response = await api.post(`/profile/reviews/${revieweeId}`, {
        rating,
        comment,
        reviewee_role: revieweeRole,
        reviewee: revieweeId,
      });

      console.log("Review posted:", response.data);
      navigate(`/profile/${revieweeId}`);
    } catch (error) {
      console.error("Error posting review:", error);
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
      <h1>Leave a Review</h1>

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
        </select>

        <label htmlFor="comment">Comment</label>
        <textarea
          id="comment"
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your feedback here..."
        />

        <button type="submit">Submit Review</button>
      </form>
    </div>
  );
}

export default FormReview;
