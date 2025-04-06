import React, { useState, useEffect } from "react";
import api from "../api.js";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../styles/listing_details.css";

function ListingsView() {
  const { id } = useParams();
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
            data-ride="carousel"
          >
            <ol className="carousel-indicators">
              {listing.pictures.map((picture, index) => (
                <li
                  key={index}
                  data-target="#carouselExampleIndicators"
                  data-slide-to={index}
                  className={index === 0 ? "active" : ""}
                ></li>
              ))}
            </ol>
            <div className="carousel-inner">
              {listing.pictures.map((picture, index) => (
                <div
                  key={index}
                  className={`carousel-item ${index === 0 ? "active" : ""}`}
                >
                  <img
                    src={picture.image}
                    className="d-block w-100"
                    alt="Listing Photo"
                  />
                </div>
              ))}
            </div>
            <a
              className="carousel-control-prev"
              href="#carouselExampleIndicators"
              role="button"
              data-slide="prev"
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"
              ></span>
              <span className="sr-only">Previous</span>
            </a>
            <a
              className="carousel-control-next"
              href="#carouselExampleIndicators"
              role="button"
              data-slide="next"
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"
              ></span>
              <span className="sr-only">Next</span>
            </a>
          </div>
        ) : (
          <p>No photos available for this listing.</p>
        )}
      </div>

      <a
        href={`/conversations/start/${listing.id}`}
        className="btn btn-primary mt-3"
      >
        Contact Owner
      </a>
    </div>
  );
}

export default ListingsView;
