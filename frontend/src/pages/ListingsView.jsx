import React, { useState, useEffect } from "react";
import api from "../api.js";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProfileContext } from "../contexts/ProfileContext.jsx";

function ListingsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userIncome, setUserIncome] = useState(null);
  const [listing, setListing] = useState();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (profile) {
      setUserIncome(profile.yearly_income);
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

  const getAffordability = () => {
    if (!userIncome || !listing?.price) return null;

    const monthlyIncome = userIncome / 12;
    const rentRatio = listing.price / monthlyIncome;

    if (rentRatio > 0.5) return { icon: "❌", label: "Too Expensive" };
    if (rentRatio < 0.3) return { icon: "💰", label: "Affordable" };
    return { icon: "✅", label: "Recommended" };
  };

  
  return error ? (
    <div className="alert alert-danger">{error}</div>
  ) : loading ? (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  ) : (
    <div className="container my-5">

      {/* Block 1: Basic Info */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h4 className="fw-bold mb-1">
            {listing.property_type} for Rent in {listing.city}
          </h4>
          <p className="text-muted mb-2">
            {listing.unit_number && `${listing.unit_number}, `}
            {listing.street_address}, {listing.city}, {listing.postal_code}
          </p>
          <h5 className="text-primary fw-bold mb-2">${listing.price} / month</h5>
          {userIncome &&
            (() => {
              const affordability = getAffordability();
              return affordability ? (
                <div className="alert alert-info py-2 px-3 d-inline-flex align-items-center mb-0">
                  {affordability.icon}
                  <span className="ms-2">{affordability.label}</span>
                </div>
              ) : null;
            })()}
        </div>
      </div>

      {/* Block 2: Photo Carousel */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="border-bottom pb-2">Photos</h5>
          {listing.pictures.length > 0 ? (
            <div
              id="carouselPhotos"
              className="carousel slide mt-3"
              data-bs-ride="carousel"
            >
              <div className="carousel-inner rounded overflow-hidden">
                {listing.pictures.map((picture, index) => (
                  <div
                    key={index}
                    className={`carousel-item ${index === 0 ? "active" : ""}`}
                  >
                    <img
                      src={picture.image}
                      className="d-block w-100"
                      alt={`Slide ${index + 1}`}
                      style={{ maxHeight: "400px", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#carouselPhotos"
                data-bs-slide="prev"
              >
                <span
                  className="carousel-control-prev-icon"
                  aria-hidden="true"
                ></span>
                <span className="visually-hidden">Previous</span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#carouselPhotos"
                data-bs-slide="next"
              >
                <span
                  className="carousel-control-next-icon"
                  aria-hidden="true"
                ></span>
                <span className="visually-hidden">Next</span>
              </button>
            </div>
          ) : (
            <p className="fst-italic text-muted mt-2">
              No photos available for this listing.
            </p>
          )}
        </div>
      </div>

      {/* Block 3: Description */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="border-bottom pb-2">Description</h5>
          <p className="mt-3"><strong>Space Details:</strong> {listing.description}</p>
          <p className="mt-3"><strong>Extra Amenities:</strong> {listing.extra_amenities}</p>
        </div>
      </div>

      {/* Block 4: Expandable Details */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="accordion" id="detailsAccordion">

            {/* Property Details */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingProperty">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseProperty"
                  aria-expanded="true"
                  aria-controls="collapseProperty"
                >
                  Property Details
                </button>
              </h2>
              <div
                id="collapseProperty"
                className="accordion-collapse collapse show"
                aria-labelledby="headingProperty"
                data-bs-parent="#detailsAccordion"
              >
                <div className="accordion-body">
                  <div className="row">
                    <div className="col-md-4 mb-2">
                      <p><strong>Bedrooms:</strong> {listing.bedrooms}</p>
                      <p><strong>Bathrooms:</strong> {listing.bathrooms}</p>
                      <p><strong>Square Feet:</strong> {listing.sqft_area}</p>
                      <p><strong>Parking Spaces:</strong> {listing.parking_spaces}</p>
                    </div>
                    <div className="col-md-4 mb-2">
                      <p><strong>AC:</strong> {listing.ac ? "Yes" : "No"}</p>
                      <p><strong>Heating:</strong> {listing.heating ? "Yes" : "No"}</p>
                      <p><strong>Laundry:</strong> {listing.laundry_type}</p>
                      <p><strong>Pet Friendly:</strong> {listing.pet_friendly ? "Yes" : "No"}</p>
                    </div>
                    <div className="col-md-4 mb-2">
                      <p><strong>Roommates:</strong> {listing.shareable ? "Yes" : "No"}</p>
                      <p><strong>Payment Type:</strong> {listing.payment_type}</p>
                      <p><strong>Verification:</strong> {listing.verification_status}</p>
                      <p><strong>Move-in Date:</strong> {listing.move_in_date}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingFinancial">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseFinancial"
                  aria-expanded="false"
                  aria-controls="collapseFinancial"
                >
                  Financial Details
                </button>
              </h2>
              <div
                id="collapseFinancial"
                className="accordion-collapse collapse"
                aria-labelledby="headingFinancial"
                data-bs-parent="#detailsAccordion"
              >
                <div className="accordion-body">
                  <ul className="list-unstyled">
                    <li><strong>Utilities:</strong> ${listing.utilities_cost} ({listing.utilities_payable_by_tenant ? "Tenant" : "Included"})</li>
                    <li><strong>Property Taxes:</strong> ${listing.property_taxes} ({listing.property_taxes_payable_by_tenant ? "Tenant" : "Included"})</li>
                    <li><strong>Condo Fee:</strong> ${listing.condo_fee} ({listing.condo_fee_payable_by_tenant ? "Tenant" : "Included"})</li>
                    <li><strong>HOA Fee:</strong> ${listing.hoa_fee} ({listing.hoa_fee_payable_by_tenant ? "Tenant" : "Included"})</li>
                    <li><strong>Security Deposit:</strong> ${listing.security_deposit} ({listing.security_deposit_payable_by_tenant ? "Tenant" : "Included"})</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingOwner">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseOwner"
                  aria-expanded="false"
                  aria-controls="collapseOwner"
                >
                  Owner Information
                </button>
              </h2>
              <div
                id="collapseOwner"
                className="accordion-collapse collapse"
                aria-labelledby="headingOwner"
                data-bs-parent="#detailsAccordion"
              >
                <div className="accordion-body">
                  <div className="d-flex align-items-center gap-3 mt-2">
                    <img
                      src={owner.profile_picture}
                      alt="Profile"
                      className="rounded-circle"
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        outline: "1px solid #ccc",
                      }}
                    />
                    <div>
                      <p className="mb-2 fw-bold">
                        <Link to={`/profile/${owner.id}`}>
                          {owner.first_name} {owner.last_name}
                        </Link>
                      </p>
                      {isProfileSelf(owner.id) ? (
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => navigate(`/conversations`)}
                        >
                          See Conversations
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => handleStartConversation(listing.id)}
                        >
                          Contact Owner
                        </button>
                      )}
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate(`/listings/${listing.id}/groups`)}
                      >
                        See Groups
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

export default ListingsView;
