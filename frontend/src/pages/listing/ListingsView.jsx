import React, { useState, useEffect, useRef } from "react";
import api from "../../api.js";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProfileContext } from "../../contexts/ProfileContext.jsx";
import useGoogleMaps from "../../hooks/useGoogleMaps";
import "../../styles/listing_details.css";

function ListingsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [income, setIncome] = useState(null);
  const [listing, setListing] = useState();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const {
    profile,
    isProfileSelf,
    isFavourite,
    addToFavourites,
    removeFromFavourites,
  } = useProfileContext();
  const mapRef = useRef(null);
  const googleLoaded = useGoogleMaps();

  const sendInteraction = async (type) => {
    try {
      await api.post(`/interaction/send/${id}`, { interaction: type });
    } catch (err) {
      console.error("Interaction was not send.", err);
    }
  };

  const fetchListing = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/listings/${id}`);
      const listing = response.data;

      const primaryImage = listing.pictures.find((p) => p.is_primary);
      let orderedPictures = listing.pictures;
      if (primaryImage) {
        orderedPictures = [
          primaryImage,
          ...listing.pictures.filter((p) => p.id !== primaryImage.id),
        ];
      }

      setListing({
        ...listing,
        pictures: orderedPictures,
        primary_image: primaryImage,
      });
    } catch (err) {
      setError(err.response?.data?.Location || "Failed to fetch Listings.");
      setListing(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/profile/reviews`, {
        params: { reviewee: id },
      });
      setReviews(response.data);
      const total = response.data.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating((total / response.data.length).toFixed(1));
    } catch (err) {
      setReviews(null);
      setError("Failed to fetch reviews.");
      console.error("Failed to fetch reviews.", err);
    }
  };

  useEffect(() => {
    fetchListing();
    fetchReviews();
    sendInteraction("click");
  }, [id]);

  useEffect(() => {
    if (profile) {
      setIncome(profile.yearly_income);
    }
  }, [profile]);

  // Initialize Google Map only when Maps API is loaded and listing exists
  useEffect(() => {
    if (
      googleLoaded &&
      listing &&
      listing.latitude &&
      listing.longitude &&
      mapRef.current
    ) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: listing.latitude, lng: listing.longitude },
        zoom: 15,
      });

      new window.google.maps.Marker({
        position: { lat: listing.latitude, lng: listing.longitude },
        map,
        title: listing.street_address,
      });
    }
  }, [googleLoaded, listing]);

  if (!listing || !profile) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
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
          conv.participants.some((p) => p.id === profile.id) &&
          conv.participants.some((p) => p.id === listing.owner.id)
      );

      if (existingConversation) {
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

  const handleFavourite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let favourite = isFavourite(id);
    if (favourite) {
      removeFromFavourites(Number(id));
    } else {
      addToFavourites(listing);
      sendInteraction("favourite");
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
              <h4
                className="fw-bold mb-1"
                style={{ color: "var(--wood-primary)" }}
              >
                {listing.property_type} for Rent in {listing.city}
              </h4>
              <p className="text-muted mb-2">
                {listing.unit_number && `${listing.unit_number}, `}
                {listing.street_address}, {listing.city}, {listing.postal_code}
              </p>
              <div className="d-flex align-items-center gap-2 mb-2">
                <h5 className="text-price fw-bold mb-0">
                  ${listing.price} / month
                </h5>
                {income &&
                  (() => {
                    const tag = getAffordabilityTag(listing.price);
                    return tag ? (
                      <span
                        style={{
                          backgroundColor: tag.color,
                          color: "white",
                          padding: "5px 10px",
                          borderRadius: "12px",
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                        }}
                      >
                        {tag.label}
                      </span>
                    ) : null;
                  })()}
              </div>

              <button
                className={`favourite-btn ${isFavourite(id) ? "active" : ""}`}
                onClick={handleFavourite}
                style={{
                  top: "1rem",
                }}
              >
                ♥
              </button>
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
                <div className="accordion-body" style={{ fontSize: "1.10rem" }}>
                  {listing.description}
                </div>
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
                        <strong>Square Feet:</strong> {listing.sqft_area} ft²
                      </p>
                      <p>
                        <strong>Parking Spaces:</strong>{" "}
                        {listing.parking_spaces}
                      </p>
                    </div>
                    <div className="col-md-4 mb-2">
                      <p>
                        <strong>Furnished:</strong>{" "}
                        {listing.furnished ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Laundry:</strong> {listing.laundry_type}
                      </p>
                      <p>
                        <strong>Pet Friendly:</strong>{" "}
                        {listing.pet_friendly ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Roommates:</strong>{" "}
                        {listing.shareable ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="col-md-4 mb-2">
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
              <h2 className="accordion-header" id="headingUtilities">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseUtilities"
                  aria-expanded="true"
                >
                  Utilities
                </button>
              </h2>
              <div
                id="collapseUtilities"
                className="accordion-collapse collapse show"
                aria-labelledby="headingUtilites"
              >
                <div className="accordion-body">
                  <ul className="list-unstyled">
                    <li>
                      <strong>Water:</strong>{" "}
                      {listing.water ? "Included" : "Not Included"}
                    </li>
                    <li>
                      <strong>Heat:</strong>{" "}
                      {listing.heat ? "Included" : "Not Included"}
                    </li>
                    <li>
                      <strong>Hydro:</strong>{" "}
                      {listing.hydro ? "Included" : "Not Included"}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header" id="headingAmenities">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseAmenities"
                  aria-expanded="true"
                >
                  Amenities
                </button>
              </h2>
              <div
                id="collapseAmenities"
                className="accordion-collapse collapse show"
                aria-labelledby="headingAmenities"
              >
                <div className="accordion-body">
                  <ul className="list-unstyled">
                    <li>
                      <strong>Air Conditioning:</strong>{" "}
                      {listing.ac ? "Yes" : "No"}
                    </li>
                    <li>
                      <strong>Heating:</strong> {listing.heating ? "Yes" : "No"}
                    </li>
                    <li>
                      <strong>Internet:</strong>{" "}
                      {listing.internet ? "Yes" : "No"}
                    </li>
                    <li>
                      <strong>Fridge:</strong> {listing.fridge ? "Yes" : "No"}
                    </li>
                  </ul>
                  <strong>Extra Amenities: </strong>
                  {listing.extra_amenities || "None"}
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
                src={owner.profile_picture || "/default_profile.png"}
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

            {/* --- Google Map --- */}
            {listing.latitude && listing.longitude && (
              <div
                ref={mapRef}
                style={{
                  width: "100%",
                  height: "250px",
                  marginTop: "15px",
                  borderRadius: "8px",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingsView;
