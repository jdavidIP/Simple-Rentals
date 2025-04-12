import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/profile.css";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]); // New state for reviews
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profile/${id}`);
      setProfile(response.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to fetch profile.");
    }
  };

  const fetchListings = async () => {
    try {
      const response = await api.get(`/listings/viewAll`, {
        params: { owner: id },
      });
      setListings(response.data);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to fetch listings.");
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/profile/reviews`, {
        params: { reviewee: id }, // Fetch reviews by reviewee ID
      });
      setReviews(response.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to fetch reviews.");
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchListings();
    fetchReviews(); // Fetch reviews
  }, [id]);

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!profile) {
    return <p>Loading...</p>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img
          src={profile.profile_picture || "/default-avatar.png"}
          alt={`${profile.first_name} ${profile.last_name}`}
          className="profile-picture"
        />
        <h1>{`${profile.first_name} ${profile.last_name}`}</h1>
        <p>{profile.email}</p>
        <p>{profile.phone_number}</p>
        <button
          onClick={() => navigate(`/profile/${id}/reviews`)}
          class="btn btn-primary"
        >
          Write a Review
        </button>
      </div>

      <div className="listings-section">
        <h2>Listings</h2>
        {listings.length > 0 ? (
          <div className="listings-grid">
            {listings.map((listing) => (
              <div key={listing.id} className="listing-card">
                <img
                  src={listing.pictures?.[0]?.image || "/default-listing.png"}
                  alt={listing.title}
                  className="listing-image"
                />
                <h3>{listing.title}</h3>
                <p>{listing.description}</p>
                <p>
                  <strong>Price:</strong> ${listing.price}
                </p>
                <p>
                  <strong>Location:</strong> {listing.street_address},{" "}
                  {listing.city}, {listing.postal_code || "Not specified"}
                </p>
                <button
                  className="view-more-button"
                  onClick={() => navigate(`/listings/${listing.id}`)}
                >
                  View More
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No listings found.</p>
        )}
      </div>

      <div className="reviews-section">
        <h2>Reviews</h2>
        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
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
              </div>
            ))}
          </div>
        ) : (
          <p>No reviews yet.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
