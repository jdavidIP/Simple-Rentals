import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useProfileContext } from "../contexts/ProfileContext";

function RoommatesView() {
  const { id } = useParams(); // roommate user id
  const [roommate, setRoommate] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { profile, isRoommateSelf, profileLoading } = useProfileContext();
  const navigate = useNavigate();

  const fetchRoommate = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/roommates/${id}`);
      setRoommate(response.data);
    } catch (err) {
      setError("Failed to fetch profile.");
      console.error("Failed to fetch profile.", err);
      setRoommate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoommate();
  }, [id]);

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!roommate || !id || !profile) {
    return <p>Loading...</p>;
  }

  // Destructure for easier access
  const {
    user,
    description,
    move_in_date,
    stay_length,
    occupation,
    roommate_budget,
    smoke_friendly,
    cannabis_friendly,
    pet_friendly,
    couple_friendly,
    gender_preference,
    open_to_message,
  } = roommate;

  return (
    <div className="container py-5">
      <div className="card mx-auto" style={{ maxWidth: 600 }}>
        {error ? (
          <div className="alert alert-danger">{error}</div>
        ) : loading || profileLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="card-body">
            <div className="text-center mb-3">
              <img
                src={user?.profile_picture || "/static/img/placeholder.jpg"}
                alt="Profile"
                className="rounded-circle"
                style={{ width: 120, height: 120, objectFit: "cover" }}
              />
            </div>
            <h3 className="card-title text-center mb-2">
              <Link to={`/profile/${user?.id}`}>
                {user?.first_name} {user?.last_name}
              </Link>
            </h3>
            <h6 className="text-center text-muted mb-3">{user?.email}</h6>
            <p>
              <strong>Description:</strong> {description}
            </p>
            <p>
              <strong>Move-in Date:</strong> {move_in_date}
            </p>
            <p>
              <strong>Stay Length:</strong>{" "}
              {stay_length ? `${stay_length} months` : "N/A"}
            </p>
            <p>
              <strong>Occupation:</strong> {occupation}
            </p>
            <p>
              <strong>Budget:</strong> ${roommate_budget}
            </p>
            <p>
              <strong>Gender Preference:</strong> {gender_preference}
            </p>
            <p>
              <strong>Pet Friendly:</strong> {pet_friendly ? "Yes" : "No"}
            </p>
            <p>
              <strong>Smoke Friendly:</strong> {smoke_friendly ? "Yes" : "No"}
            </p>
            <p>
              <strong>Cannabis Friendly:</strong>{" "}
              {cannabis_friendly ? "Yes" : "No"}
            </p>
            <p>
              <strong>Couple Friendly:</strong> {couple_friendly ? "Yes" : "No"}
            </p>
            <p>
              <strong>Open to Message:</strong> {open_to_message ? "Yes" : "No"}
            </p>
            <p>
              <strong>Preferred Location:</strong> {user?.preferred_location}
            </p>
            {isRoommateSelf(id) && (
              <button
                onClick={() => navigate(`/roommates/edit/${id}`)}
                className="btn btn-primary"
              >
                Edit Roommate Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoommatesView;
