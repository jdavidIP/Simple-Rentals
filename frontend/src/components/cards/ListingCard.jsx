import { useNavigate } from "react-router-dom";
import { useProfileContext } from "../../contexts/ProfileContext";
import api from "../../api";
import { useState } from "react";

function ListingCard({ listing, income, styling = null }) {
  const navigate = useNavigate();
  const { isProfileSelf, profile } = useProfileContext();
  const [error, setError] = useState(null);

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
          "Failed to start conversation.",
        err
      );
    }
  };

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

  return (
    <div
      key={listing.id}
      className={
        styling
          ? "card shadow-sm position-relative"
          : "card col-12 col-sm-6 col-md-4 col-lg-4 mb-4 shadow-sm position-relative"
      }
      style={styling ? { maxHeight: "1000px" } : { minHeight: "100%" }}
    >
      {/* Affordability Tag */}
      {income &&
        (() => {
          const tag = getAffordabilityTag(listing.price);
          return tag ? (
            <div
              style={{
                position: "absolute",
                top: "10px",
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

      {/* Image */}
      <img
        src={
          listing.primary_image
            ? listing.primary_image.image
            : "/static/img/placeholder.jpg"
        }
        alt="Listing"
        className="card-img-top border-bottom mt-2"
        style={{ objectFit: "cover", aspectRatio: "4/3" }}
      />

      {/* Card Body */}
      <div className="card-body d-flex flex-column justify-content-between">
        <div>
          <h5 className="card-title mb-1 text-capitalize">
            {listing.bedrooms} bedroom {listing.property_type}
          </h5>
          <p className="text-muted mb-2">
            {" "}
            {listing.street_address}, {listing.city}, {listing.postal_code}
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

        {/* Buttons */}
        <div className="d-flex flex-wrap gap-2 mt-auto">
          <button
            className="btn btn-outline-primary flex-fill"
            onClick={() => navigate(`/listings/${listing.id}`)}
          >
            View Details
          </button>

          {isProfileSelf(listing.owner.id) ? (
            <button
              className="btn btn-outline-secondary flex-fill"
              onClick={() => navigate(`/listings/edit/${listing.id}`)}
            >
              Edit Listing
            </button>
          ) : (
            <button
              className="btn btn-outline-success flex-fill"
              onClick={() => handleStartConversation(listing.id)}
            >
              Contact Owner
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingCard;
