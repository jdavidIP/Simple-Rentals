import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import "../../styles/profile.css";
import { useProfileContext } from "../../contexts/ProfileContext";
import ReviewCard from "../../components/cards/ReviewCard";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRoommate, setLoadingRoommate] = useState(true);
  const [selectedTab, setSelectedTab] = useState("listings");
  const { isProfileSelf } = useProfileContext();

  const [roommate, setRoommate] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, listingsRes, reviewsRes] = await Promise.all([
        api.get(`/profile/${id}`),
        api.get(`/listings/viewAll`, { params: { owner: id } }),
        api.get(`/profile/reviews`, { params: { reviewee: id } }),
      ]);

      setProfile(profileRes.data);

      const processedListings = listingsRes.data.map((listing) => {
        const primaryImage = listing.pictures.find((p) => p.is_primary);
        return {
          ...listing,
          pictures: primaryImage
            ? [
                primaryImage,
                ...listing.pictures.filter((p) => p.id !== primaryImage.id),
              ]
            : listing.pictures,
        };
      });
      setListings(processedListings);

      setReviews(reviewsRes.data);
      const total = reviewsRes.data.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating(
        reviewsRes.data.length > 0
          ? (total / reviewsRes.data.length).toFixed(1)
          : null
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoommate = async () => {
    setLoadingRoommate(true);
    try {
      const roommateRes = await api.get(
        `/roommates/${profile.roommate_profile}`
      );
      setRoommate(roommateRes.data);
    } catch (err) {
      console.log("Error fetching roommate.", err);
      setRoommate(null);
    } finally {
      setLoadingRoommate(false);
    }
  };

  function formatPhoneDisplay(input) {
    if (!input) return "";

    let digits = input.replace(/\D/g, "");

    if (digits.length === 11 && digits.startsWith("1")) {
      digits = digits.substring(1);
    }

    digits = digits.substring(0, 10);

    const area = digits.substring(0, 3);
    const prefix = digits.substring(3, 6);
    const line = digits.substring(6, 10);

    if (digits.length > 6) return `(${area}) ${prefix}-${line}`;
    if (digits.length > 3) return `(${area}) ${prefix}`;
    if (digits.length > 0) return `(${area}`;
    return "";
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (profile && !loading) {
      fetchRoommate();
    }
  }, [profile]);

  return (
    <div className="profile-layout container my-5">
      {error ? (
        <div className="alert alert-danger text-center">{error}</div>
      ) : loading || loadingRoommate ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="row">
          {/* Left Sidebar */}
          <div className="col-md-4 col-lg-3">
            <div
              className="profile-sidebar rounded sticky-top"
              style={{ top: "100px" }}
            >
              <div className="card shadow-sm text-center p-3">
                <img
                  src={profile.profile_picture || "/static/images/default_profile.png"}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="rounded-circle mx-auto"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                  }}
                />
                <h5 className="mt-2">{`${profile.first_name} ${profile.last_name}`}</h5>
                <p className="text-muted small mb-1">{profile.email}</p>
                <p className="text-muted small">
                  +1 -{" " + formatPhoneDisplay(profile.phone_number)}
                </p>

                {averageRating && (
                  <div className="rating mt-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        style={{
                          color:
                            i < Math.round(averageRating)
                              ? "#ffc107"
                              : "#e4e5e9",
                        }}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ms-2 text-muted">({reviews.length})</span>
                  </div>
                )}

                <div className="btn-group mt-3 w-100">
                  <button
                    className={`btn btn-sm ${
                      selectedTab === "listings"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setSelectedTab("listings")}
                  >
                    Listings
                  </button>
                  <button
                    className={`btn btn-sm ${
                      selectedTab === "reviews"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setSelectedTab("reviews")}
                  >
                    Reviews
                  </button>
                </div>

                <div className="mt-3 d-grid gap-2">
                  {roommate && (
                    <button
                      onClick={() => navigate(`/roommates/${roommate.id}`)}
                      className="btn btn-outline-success btn-sm"
                    >
                      See Roommate Profile
                    </button>
                  )}
                  {isProfileSelf(profile.id) ? (
                    <>
                      <button
                        onClick={() => navigate(`/listings/post`)}
                        className="btn btn-outline-success btn-sm"
                      >
                        Create Listing
                      </button>
                      {!roommate && (
                        <button
                          onClick={() => navigate("/roommates/post")}
                          className="btn btn-outline-success btn-sm"
                        >
                          Create Roommate Profile
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/profile/edit/${id}`)}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        Edit Profile
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(`/profile/${id}/reviews`)}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Write a Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-md-8 col-lg-9">
            {selectedTab === "listings" ? (
              <>
                <h5 className="mb-3 border-bottom pb-2">Listings</h5>
                {listings.length > 0 ? (
                  <div className="row">
                    {listings.map((listing) => (
                      <div key={listing.id} className="col-md-6 mb-4">
                        <div className="card h-100 shadow-sm">
                          <img
                            src={
                              listing.pictures?.[0]?.image ||
                              "/default-listing.png"
                            }
                            alt="Listing"
                            className="card-img-top"
                            style={{ height: "180px", objectFit: "cover" }}
                          />
                          <div className="card-body d-flex flex-column">
                            <div>
                              <h5 className="card-title mb-1 text-capitalize">
                                {listing.bedrooms} bedroom{" "}
                                {listing.property_type}
                              </h5>
                              <p className="text-muted mb-2">
                                {" "}
                                {listing.street_address}, {listing.city},{" "}
                                {listing.postal_code}
                              </p>

                              <h6
                                className="text-price fw-bold"
                                style={{
                                  fontSize: "1.75rem",
                                }}
                              >
                                ${listing.price.toLocaleString()}
                              </h6>

                              <p className="mb-3">
                                <strong>Move-in:</strong> {listing.move_in_date}
                              </p>
                            </div>
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
              </>
            ) : (
              <>
                <h5 className="mb-3 border-bottom pb-2">Reviews</h5>
                {reviews.length > 0 ? (
                  <div className="row">
                    {reviews.map((review) => (
                      <div key={review.id} className="col-md-6 mb-4">
                        <ReviewCard review={review} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted fst-italic">No reviews yet.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
