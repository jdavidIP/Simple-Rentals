import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/profile.css";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profile/${id}`);
      setProfile(response.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to fetch profile.");
    }
  };

  const fetchListings = async () => {
    try {
      const response = await api.get(`/listings/viewAll`, {
        params: { owner: id },
      });
      setListings(response.data);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to fetch listings.");
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchListings();
  }, [id]);

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!profile) {
    return <p>Loading...</p>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img
          src={profile.profile_picture || "/default-avatar.png"}
          alt={`${profile.first_name} ${profile.last_name}`}
          className="profile-picture"
        />
        <h1>{`${profile.first_name} ${profile.last_name}`}</h1>
        <p>{profile.email}</p>
        <p>{profile.phone_number}</p>
      </div>

      <div className="listings-section">
        <h2>Listings</h2>
        {listings.length > 0 ? (
          <div className="listings-grid">
            {listings.map((listing) => (
              <div key={listing.id} className="listing-card">
                <img
                  src={listing.pictures?.[0]?.image || "/default-listing.png"}
                  alt={listing.title}
                  className="listing-image"
                />
                <h3>{listing.title}</h3>
                <p>{listing.description}</p>
                <p>
                  <strong>Price:</strong> ${listing.price}
                </p>
                <p>
                  <strong>Location:</strong> {listing.street_address},{" "}
                  {listing.city}, {listing.postal_code || "Not specified"}
                </p>
                <button
                  className="view-more-button"
                  onClick={() => navigate(`/listings/${listing.id}`)}
                >
                  View More
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No listings found.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
