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
  const { profile, isProfileSelf } = useProfileContext();

  const fetchListing = async () => {
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
      // Check if conversation already exists
      const existingConversations = await api.get("/conversations/");
      const existingConversation = existingConversations.data.find(
        (conv) => String(conv.listing.id) === String(listingId)
      );

      if (existingConversation) {
        console.log("Existing conversation found:", existingConversation.id);
        navigate(`/conversations/${existingConversation.id}`);
        return;
      }

      // If not, create a new conversation
      const response = await api.post(
        `/listing/${listingId}/start_conversation/`,
        {}
      );
      const conversationId = response.data.id;
      navigate(`/conversations/${conversationId}`);
    } catch (err) {
      if (err.response.statusText === "Unauthorized") {
        setError("Log In to start a conversation with the owner.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
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

  return (
    <div>
      <div className="container my-5 p-4 bg-white rounded shadow">
        {/* Header */}
        <div className="mb-4">
          <h1 className="mb-2">
            {listing.property_type} for Rent in {listing.city}
          </h1>
          <h5 className="text-muted">
            {listing.unit_number && `${listing.unit_number}, `}
            {listing.street_address}, {listing.city}, {listing.postal_code}
          </h5>
          <h3 className="text-primary fw-bold mt-2">
            ${listing.price} / month
          </h3>
          {userIncome &&
            (() => {
              const affordability = getAffordability();
              return affordability ? (
                <div className="mt-1">
                  <span className="fw-semibold">
                    {affordability.icon} {affordability.label}
                  </span>
                </div>
              ) : null;
            })()}
          {error && <p className="text-danger fw-semibold">{error}</p>}
        </div>

        {/* Owner Info */}
        <div className="mb-4">
          <h5 className="border-bottom pb-2">Owner Information</h5>
          <div className="d-flex align-items-center gap-3 mt-3">
            <img
              src={owner.profile_picture}
              alt="Profile"
              className="rounded-circle"
              style={{
                width: "10rem",
                height: "10rem",
                objectFit: "cover",
                outline: "0.5px solid #000",
              }}
            />
            <div>
              <p className="mb-3 fw-bold">
                <Link to={`/profile/${owner.id}`}>
                  {owner.first_name} {owner.last_name}
                </Link>
              </p>
              {isProfileSelf(owner.id) ? (
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => navigate(`/conversations`)}
                >
                  See Conversations
                </button>
              ) : (
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => handleStartConversation(listing.id)}
                >
                  Contact Owner
                </button>
              )}
              <button
                className="btn btn-primary mt-3"
                onClick={() => navigate(`/listings/${listing.id}/groups`)}
              >
                See Groups
              </button>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="mb-4">
          <h5 className="border-bottom pb-2">Photos</h5>
          {listing.pictures.length > 0 ? (
            <div
              id="carouselExampleIndicators"
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
                    />
                  </div>
                ))}
              </div>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#carouselExampleIndicators"
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
                data-bs-target="#carouselExampleIndicators"
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
            <p className="fst-italic text-muted">
              No photos available for this listing.
            </p>
          )}
        </div>

        {/* Property Details */}
        <div className="mb-4">
          <h2 className="h5 border-bottom pb-2">Property Details</h2>
          <div className="row mt-3">
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
                <strong>Parking Spaces:</strong> {listing.parking_spaces}
              </p>
            </div>
            <div className="col-md-4 mb-2">
              <p>
                <strong>AC:</strong> {listing.ac ? "Yes" : "No"}
              </p>
              <p>
                <strong>Heating:</strong> {listing.heating ? "Yes" : "No"}
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
                <strong>Roommates:</strong> {listing.shareable ? "Yes" : "No"}
              </p>
              <p>
                <strong>Payment Type:</strong> {listing.payment_type}
              </p>
              <p>
                <strong>Verification:</strong> {listing.verification_status}
              </p>
              <p>
                <strong>Move-in Date:</strong> {listing.move_in_date}
              </p>
            </div>
          </div>
        </div>

        {/* Description & Amenities */}
        <div className="mb-4">
          <h2 className="h5 border-bottom pb-2">Description</h2>
          <h6 className="mt-3">Space Details</h6>
          <p>{listing.description}</p>
          <h6 className="mt-3">Extra Amenities</h6>
          <p>{listing.extra_amenities}</p>
        </div>

        {/* Financial Info */}
        <div className="mb-4">
          <h5 className="border-bottom pb-2">Financial Details</h5>
          <ul className="list-unstyled mt-3">
            <li>
              <strong>Utilities:</strong> ${listing.utilities_cost} (
              {listing.utilities_payable_by_tenant
                ? "Paid by Tenant"
                : "Included"}
              )
            </li>
            <li>
              <strong>Property Taxes:</strong> ${listing.property_taxes} (
              {listing.property_taxes_payable_by_tenant
                ? "Paid by Tenant"
                : "Included"}
              )
            </li>
            <li>
              <strong>Condo Fee:</strong> ${listing.condo_fee} (
              {listing.condo_fee_payable_by_tenant
                ? "Paid by Tenant"
                : "Included"}
              )
            </li>
            <li>
              <strong>HOA Fee:</strong> ${listing.hoa_fee} (
              {listing.hoa_fee_payable_by_tenant
                ? "Paid by Tenant"
                : "Included"}
              )
            </li>
            <li>
              <strong>Security Deposit:</strong> ${listing.security_deposit} (
              {listing.security_deposit_payable_by_tenant
                ? "Paid by Tenant"
                : "Included"}
              )
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ListingsView;
