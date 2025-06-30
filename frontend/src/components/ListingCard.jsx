import { useNavigate } from "react-router-dom";
import { useProfileContext } from "../contexts/ProfileContext";
import api from "../api";
import { useState } from "react";

function ListingCard({ listing, income }) {
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
      className="card col-3 m-4 shadow-sm position-relative"
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
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "0.8rem",
                zIndex: 10,
              }}
            >
              {tag.label}
            </div>
          ) : null;
        })()}

      {/* Image */}
      {listing.primary_image ? (
        <img
          src={listing.primary_image.image}
          alt="Listing"
          className="card-img-top border-2 border-bottom my-1"
          style={{ maxHeight: "20rem", objectFit: "cover" }}
        />
      ) : (
        <img
          src="/static/img/placeholder.jpg"
          alt="No Image Available"
          className="card-img-top my-1"
          style={{ maxHeight: "20rem", objectFit: "cover" }}
        />
      )}

      {/* Body */}
      <div className="card-body">
        <h5 className="card-title mb-2">
          {listing.bedrooms} bedroom {listing.property_type} in {listing.city}
        </h5>

        <h6 className="text-primary fw-semibold mb-3">${listing.price}</h6>

        <p className="mb-3">
          <strong>Move-in:</strong> {listing.move_in_date}
        </p>

        <div className="d-flex justify-content-evenly">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(`/listings/${listing.id}`)}
          >
            View Details
          </button>

          {isProfileSelf(listing.owner.id) ? (
            <button
              className="edit-button"
              onClick={() => navigate(`/listings/edit/${listing.id}`)}
            >
              Edit Listing
            </button>
          ) : (
            <button
              className="btn btn-outline-success"
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
