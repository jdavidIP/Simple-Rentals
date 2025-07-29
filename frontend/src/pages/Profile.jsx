import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/profile.css";
import { useProfileContext } from "../contexts/ProfileContext.jsx";
import ReviewCard from "../components/ReviewCard.jsx";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [error, setError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [roommateId, setRoommateId] = useState(false);
  const { isProfileSelf } = useProfileContext();

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await api.get(`/profile/${id}`);
      setProfile(response.data);
      setRoommateId(response.data.roommate_profile);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to fetch profile.");
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const response = await api.get(`/listings/viewAll`, {
        params: { owner: id },
      });
      const processedListings = response.data.map((listing) => {
        // Find the primary image
        const primaryImage = listing.pictures.find((p) => p.is_primary);
        // If primary image exists, put it first in the array
        let orderedPictures = listing.pictures;
        if (primaryImage) {
          orderedPictures = [
            primaryImage,
            ...listing.pictures.filter((p) => p.id !== primaryImage.id),
          ];
        }
        return {
          ...listing,
          pictures: orderedPictures,
          primary_image: primaryImage,
        };
      });

      setListings(processedListings);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError(err.response?.data?.Location || "Failed to fetch Listings.");
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await api.get(`/profile/reviews`, {
        params: { reviewee: id }, // Fetch reviews by reviewee ID
      });
      setReviews(response.data);
      calculateAverageRating(response.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to fetch reviews.");
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const calculateAverageRating = (reviews) => {
    if (!reviews.length) return null;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    setAverageRating((total / reviews.length).toFixed(1));
  };

  useEffect(() => {
    fetchProfile();
    fetchListings();
    fetchReviews(); // Fetch reviews
  }, [id]);
  return (
    <div className="container my-5">
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : loadingListings || loadingProfile || loadingReviews ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <div className="card shadow-sm mb-4">
            <div className="card-body d-flex flex-column align-items-center text-center">
              <img
                src={profile.profile_picture || "/default-avatar.png"}
                alt={`${profile.first_name} ${profile.last_name}`}
                className="rounded-circle mb-3"
                style={{ width: "120px", height: "120px", objectFit: "cover" }}
              />
              <h4 className="fw-bold">{`${profile.first_name} ${profile.last_name}`}</h4>
              {averageRating && reviews.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "0.3rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      style={{
                        color:
                          i < Math.round(averageRating) ? "#ffc107" : "#e4e5e9",
                        fontSize: "1.5rem",
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "1rem",
                      color: "#555",
                    }}
                  >
                    ({reviews.length})
                  </span>
                </div>
              )}
              <p className="text-muted mb-1">{profile.email}</p>
              <p className="text-muted">{profile.phone_number}</p>

              <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                {isProfileSelf(profile.id) ? (
                  <>
                    <button
                      onClick={() => navigate(`/listings/post`)}
                      className="btn btn-primary"
                    >
                      Create Listing
                    </button>
                    <button
                      onClick={() => navigate(`/profile/edit/${id}`)}
                      className="btn btn-outline-secondary"
                    >
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate(`/profile/${id}/reviews`)}
                    className="btn btn-primary"
                  >
                    Write a Review
                  </button>
                )}
                {roommateId ? (
                  <button
                    onClick={() =>
                      navigate(`/roommates/${profile.roommate_profile}`)
                    }
                    className="btn btn-outline-info"
                  >
                    See Roommate Profile
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/roommates/post")}
                    className="btn btn-outline-info"
                  >
                    Create a Roommate Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Listings Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-4 border-bottom pb-2">Listings</h5>
              {listings.length > 0 ? (
                <div className="row">
                  {listings.map((listing) => (
                    <div key={listing.id} className="col-md-6 col-lg-4 mb-4">
                      <div className="card h-100 shadow-sm">
                        <img
                          src={
                            listing.pictures?.[0]?.image ||
                            "/default-listing.png"
                          }
                          alt={listing.title}
                          className="card-img-top"
                          style={{ height: "180px", objectFit: "cover" }}
                        />
                        <div className="card-body d-flex flex-column">
                          <h6 className="card-title">{listing.title}</h6>
                          <p className="text-muted small flex-grow-1">
                            {listing.description}
                          </p>
                          <p className="mb-1">
                            <strong>Price:</strong> ${listing.price}
                          </p>
                          <p className="mb-2">
                            <strong>Location:</strong> {listing.street_address},{" "}
                            {listing.city}, {listing.postal_code || "N/A"}
                          </p>
                          <div className="d-flex gap-2 mt-auto">
                            <button
                              className="btn btn-sm btn-outline-primary w-100"
                              onClick={() =>
                                navigate(`/listings/${listing.id}`)
                              }
                            >
                              View More
                            </button>
                            {isProfileSelf(profile.id) && (
                              <button
                                className="btn btn-sm btn-outline-secondary w-100"
                                onClick={() =>
                                  navigate(`/listings/edit/${listing.id}`)
                                }
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted fst-italic">No listings found.</p>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-4 border-bottom pb-2">Reviews</h5>
              {reviews.length > 0 ? (
                <div className="row">
                  {reviews.map((review) => (
                    <div className="col-md-6 col-lg-4 mb-4" key={review.id}>
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted fst-italic">No reviews yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
