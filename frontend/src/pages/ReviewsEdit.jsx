import { useEffect, useState } from "react";
import FormReview from "../components/FormReview";
import { useProfileContext } from "../contexts/ProfileContext";
import api from "../api";
import { useParams } from "react-router-dom";
import Unauthorized from "./Unauthorized.jsx";

function ReviewsEdit() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(null);
  const { isProfileSelf } = useProfileContext();

  const fetchReview = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reviews/${id}`);
      setReview(response.data);
    } catch (err) {
      console.error("Failed to fetch review.", err);
      setError("Failed to fetch review.");
      setReview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [id]);

  useEffect(() => {
    if (review) {
      setAuthorized(isProfileSelf(review.reviewer.id));
    }
  }, [review]);

  return error ? (
    <div className="alert alert-danger">{error}</div>
  ) : loading ? (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status" />
    </div>
  ) : !authorized ? (
    <Unauthorized />
  ) : review ? (
    <FormReview method="edit" review={review} />
  ) : (
    <div>No review found.</div>
  );
}

export default ReviewsEdit;
