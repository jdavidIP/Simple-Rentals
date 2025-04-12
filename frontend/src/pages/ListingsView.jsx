import React, { useState, useEffect } from "react";
import api from "../api.js";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../styles/listing_details.css";

function ListingsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState();
  const [error, setError] = useState(null); // State to handle errors

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}`);

      setListing(response.data);
    } catch (err) {
      console.error("Error fetching listing:", err);
      setError("Failed to fetch listing.");
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  if (!listing) {
    return <p>Loading...</p>;
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
      const response = await api.post(`/listing/${listingId}/start_conversation/`, {});
      const conversationId = response.data.id;
      navigate(`/conversations/${conversationId}`);
    } catch (err) {
      console.error("Error starting conversation:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="listing-details-container">
      <h1>{listing.property_type} for Rent</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="listing-details">
        <p>
          <strong>Price:</strong> ${listing.price}
        </p>
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
          <strong>Address:</strong> {listing.street_address}, {listing.city},{" "}
          {listing.postal_code}
        </p>
        <p>
          <strong>Description:</strong> {listing.description}
        </p>
        <p>
          <strong>Move-in Date:</strong> {listing.move_in_date}
        </p>
        <p>
          <strong>Pet Friendly:</strong> {listing.pet_friendly ? "Yes" : "No"}
        </p>
        <p>
          <strong>Heating:</strong> {listing.heating ? "Yes" : "No"}
        </p>
        <p>
          <strong>Laundry Type:</strong> {listing.laundry_type}
        </p>
        <p>
          <strong>Payment Type:</strong> {listing.payment_type}
        </p>
        <p>
          <strong>Parking Spaces:</strong> {listing.parking_spaces}
        </p>
        <p>
          <strong>Verification Status:</strong> {listing.verification_status}
        </p>
      </div>

      <h2>Photos</h2>
      <div className="carousel-container">
        {listing.pictures.length > 0 ? (
          <div
            id="carouselExampleIndicators"
            className="carousel slide"
            data-bs-ride="carousel"
          >
            <div className="carousel-indicators">
              {listing.pictures.map((picture, index) => (
                <button
                  type="button"
                  data-bs-target="#carouselExampleIndicators"
                  data-bs-slide-to={index}
                  className={index === 0 ? "active" : ""}
                  aria-current={index === 0 ? "true" : undefined}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
            <div className="carousel-inner">
              {listing.pictures.map((picture, index) => (
                <div
                  key={index}
                  className={`carousel-item ${index === 0 ? "active" : ""}`}
                >
                  <img
                    src={picture.image}
                    className="d-block w-100"
                    alt={`Listing photo #${index + 1}`}
                  ></img>
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
          <p>No photos available for this listing.</p>
        )}
      </div>

      <button
        className="btn btn-primary mt-3"
        onClick={() => handleStartConversation(listing.id)}>
        Contact Owner
      </button>
    </div>
  );
}

export default ListingsView;
