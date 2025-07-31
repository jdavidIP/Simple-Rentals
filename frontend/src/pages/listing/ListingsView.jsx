import React, { useState, useEffect } from "react";
import api from "../../api.js";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProfileContext } from "../../contexts/ProfileContext.jsx";

function ListingsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [income, setIncome] = useState(null);
  const [listing, setListing] = useState();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const { profile, isProfileSelf } = useProfileContext();

  const fetchListing = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/listings/${id}`);
      const listing = response.data;
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

      const processedListing = {
        ...listing,
        pictures: orderedPictures,
        primary_image: primaryImage,
      };
      setListing(processedListing);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError(err.response?.data?.Location || "Failed to fetch Listings.");
      setListing(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/profile/reviews`, {
        params: { reviewee: id },
      });
      setReviews(response.data);
      const total = response.data.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating((total / response.data.length).toFixed(1));
    } catch (err) {}
  };

  useEffect(() => {
    fetchListing();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (profile) {
      setIncome(profile.yearly_income);
    }
  }, [profile]);

  if (!listing) {
    return <div className="text-center fs-4 mt-5">Loading listing...</div>;
  }

  const handleStartConversation = async (listingId) => {
    try {
      // Check if conversation already exists between the user and the listing owner for this listing
      const existingConversations = await api.get("/conversations/");
      const existingConversation = existingConversations.data.find(
        (conv) =>
          String(conv.listing.id) === String(listingId) &&
          conv.participants &&
          conv.participants.length === 2 &&
          conv.participants.some((p) => p === profile.id) &&
          conv.participants.some((p) => p === listing.owner.id)
      );

      if (existingConversation) {
        console.log("Existing conversation found:", existingConversation.id);
        navigate(`/conversations/${existingConversation.id}`);
        return;
      }

      // If not, create a new conversation
      const response = await api.post(
        `/listing/${listingId}/start_conversation`,
        {}
      );
      const conversationId = response.data.id;
      navigate(`/conversations/${conversationId}`);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Failed to start conversation."
      );
    }
  };
  const owner = listing.owner;

  const getAffordabilityTag = (price) => {
    if (!income) {
      console.log("User income not loaded yet");
      return null;
    }

    const monthlyIncome = income / 12;

    if (price > monthlyIncome * 0.4) {
      return { label: "❌ Too Expensive", color: "#dc3545" };
    } else if (price <= monthlyIncome * 0.25) {
      return { label: "💰 Affordable", color: "#0d6efd" };
    } else {
      return { label: "✅ Recommended", color: "#198754" };
    }
  };

  return error ? (
    <div className="alert alert-danger">{error}</div>
  ) : loading ? (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  ) : (
    <div className="container my-5">
      <div className="row">
        {/* LEFT: Listing Details */}
        <div className="col-lg-8">
          {/* Carousel */}
          {listing.pictures?.length > 0 && (
            <div id="listingCarousel" className="carousel slide mb-4">
              <div className="carousel-inner">
                {listing.pictures.map((img, i) => (
                  <div
                    className={`carousel-item ${i === 0 ? "active" : ""}`}
                    key={img.id}
                  >
                    <img
                      src={img.image}
                      className="d-block w-100 rounded"
                      alt={`Listing ${i}`}
                      style={{
                        maxHeight: "400px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#listingCarousel"
                data-bs-slide="prev"
              >
                <span className="carousel-control-prev-icon" />
              </button>
              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#listingCarousel"
                data-bs-slide="next"
              >
                <span className="carousel-control-next-icon" />
              </button>
            </div>
          )}

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h4 className="fw-bold mb-1">
                {listing.property_type} for Rent in {listing.city}
              </h4>
              <p className="text-muted mb-2">
                {listing.unit_number && `${listing.unit_number}, `}
                {listing.street_address}, {listing.city}, {listing.postal_code}
              </p>
              <h5 className="text-primary fw-bold mb-2">
                ${listing.price} / month
              </h5>
              {income &&
                (() => {
                  const tag = getAffordabilityTag(listing.price);
                  return tag ? (
                    <div
                      style={{
                        position: "absolute",
                        top: "20px",
                        right: "10px",
                        backgroundColor: tag.color,
                        color: "white",
                        padding: "5px 10px",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        zIndex: 10,
                      }}
                    >
                      {tag.label}
                    </div>
                  ) : null;
                })()}
            </div>
          </div>

          {/* Accordions */}
          <div className="accordion mt-4" id="listingAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingDesc">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseDesc"
                  aria-expanded="true"
                >
                  Description
                </button>
              </h2>
              <div
                id="collapseDesc"
                className="accordion-collapse collapse show"
                aria-labelledby="headingDesc"
              >
                <div className="accordion-body">{listing.description}</div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header" id="headingProperty">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseProperty"
                  aria-expanded="true"
                >
                  Property Details
                </button>
              </h2>
              <div
                id="collapseProperty"
                className="accordion-collapse collapse show"
                aria-labelledby="headingProperty"
              >
                <div className="accordion-body">
                  <div className="row">
                    <div className="col-md-4 mb-2">
                      <p>
                        <strong>Bedrooms:</strong> {listing.bedrooms}
                      </p>
                      <p>
                        <strong>Bathrooms:</strong> {listing.bathrooms}
                      </p>
                      <p>
                        <strong>Square Feet:</strong> {listing.sqft_area}
                      </p>
                      <p>
                        <strong>Parking Spaces:</strong>{" "}
                        {listing.parking_spaces}
                      </p>
                    </div>
                    <div className="col-md-4 mb-2">
                      <p>
                        <strong>AC:</strong> {listing.ac ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Heating:</strong>{" "}
                        {listing.heating ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Laundry:</strong> {listing.laundry_type}
                      </p>
                      <p>
                        <strong>Pet Friendly:</strong>{" "}
                        {listing.pet_friendly ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="col-md-4 mb-2">
                      <p>
                        <strong>Roommates:</strong>{" "}
                        {listing.shareable ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Payment Type:</strong> {listing.payment_type}
                      </p>
                      <p>
                        <strong>Verification:</strong>{" "}
                        {listing.verification_status}
                      </p>
                      <p>
                        <strong>Move-in Date:</strong> {listing.move_in_date}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header" id="headingFinancials">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseFinancials"
                  aria-expanded="true"
                >
                  Financial Info
                </button>
              </h2>
              <div
                id="collapseFinancials"
                className="accordion-collapse collapse show"
                aria-labelledby="headingFinancials"
              >
                <div className="accordion-body">
                  <ul className="list-unstyled">
                    <li>
                      <strong>Utilities:</strong> ${listing.utilities_cost} (
                      {listing.utilities_payable_by_tenant
                        ? "Tenant"
                        : "Included"}
                      )
                    </li>
                    <li>
                      <strong>Property Taxes:</strong> ${listing.property_taxes}{" "}
                      (
                      {listing.property_taxes_payable_by_tenant
                        ? "Tenant"
                        : "Included"}
                      )
                    </li>
                    <li>
                      <strong>Condo Fee:</strong> ${listing.condo_fee} (
                      {listing.condo_fee_payable_by_tenant
                        ? "Tenant"
                        : "Included"}
                      )
                    </li>
                    <li>
                      <strong>HOA Fee:</strong> ${listing.hoa_fee} (
                      {listing.hoa_fee_payable_by_tenant
                        ? "Tenant"
                        : "Included"}
                      )
                    </li>
                    <li>
                      <strong>Security Deposit:</strong> $
                      {listing.security_deposit} (
                      {listing.security_deposit_payable_by_tenant
                        ? "Tenant"
                        : "Included"}
                      )
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Owner Sidebar */}
        <div className="col-lg-4">
          <div
            className="owner-sidebar bg-white shadow-sm p-3 rounded sticky-top"
            style={{ top: "100px" }}
          >
            <div className="text-center">
              <img
                src={
                  owner.profile_picture || "../../../public/default_profile.png"
                }
                alt="Owner"
                className="rounded-circle mb-3"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  outline: "1px solid #ccc",
                }}
              />
              <h5 className="mb-1">
                <Link to={`/profile/${owner.id}`}>
                  {owner.first_name} {owner.last_name}
                </Link>
              </h5>
              <p className="text-muted small mb-1">{profile.email}</p>
              <p className="text-muted small">{profile.phone_number}</p>
              {averageRating && (
                <div className="rating mt-2">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      style={{
                        color:
                          i < Math.round(averageRating) ? "#ffc107" : "#e4e5e9",
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ms-2 text-muted">({reviews.length})</span>
                </div>
              )}
            </div>

            <div className="d-grid gap-2 mt-3">
              {isProfileSelf(owner.id) ? (
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate(`/conversations`)}
                >
                  See Conversations
                </button>
              ) : (
                <button
                  className="btn btn-outline-primary"
                  onClick={() => handleStartConversation(listing.id)}
                >
                  Contact Owner
                </button>
              )}

              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/listings/${listing.id}/groups`)}
              >
                See Groups
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingsView;
