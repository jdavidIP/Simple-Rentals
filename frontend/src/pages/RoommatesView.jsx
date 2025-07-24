import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useProfileContext } from "../contexts/ProfileContext";
import {
  FaDog,
  FaSmoking,
  FaCannabis,
  FaUsers,
  FaEnvelopeOpenText,
} from "react-icons/fa";
import { BsCheckCircle, BsXCircle } from "react-icons/bs";

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
      <div className="card mx-auto shadow-sm" style={{ maxWidth: 700 }}>
        {error ? (
          <div className="alert alert-danger">{error}</div>
        ) : loading || profileLoading ? (
          <div className="text-center my-5">Loading...</div>
        ) : (
          <div className="card-body">
            {/* Profile Picture & Name */}
            <div className="text-center mb-4">
              <img
                src={user?.profile_picture || "/static/img/placeholder.jpg"}
                alt="Profile"
                className="rounded-circle border"
                style={{ width: 120, height: 120, objectFit: "cover" }}
              />
              <h3 className="mt-3">
                <Link to={`/profile/${user?.id}`} className="text-decoration-none text-dark">
                  {user?.first_name} {user?.last_name}
                </Link>
              </h3>
              <p className="text-muted mb-1">{occupation}</p>
              <p className="text-muted">{description}</p>
            </div>

            <hr />

            {/* High Priority Info */}
            <div className="mb-4 text-center">
              <h5 className="mb-3">🏠 Key Info</h5>
              <div className="row">
                  <p className="col-6"><strong>Preferred Area:</strong> {user?.preferred_location}</p>
                  <p className="col-6"><strong>Budget:</strong> ${roommate_budget?.toLocaleString()}</p>
                  <p className="col-6"><strong>Move-in Date:</strong> {move_in_date}</p>
                  <p className="col-6"><strong>Stay Length:</strong> {stay_length ? `${stay_length} months` : "N/A"}</p>
              </div>
            </div>

            <hr />

            {/* Lifestyle Preferences (Icons section unchanged) */}
            <div className="row text-center mb-4 justify-content-center gy-3">
              
              <h5 className="mb-3">📝 Preferences</h5>
              <div className="col-4 mb-3">
                <FaDog size={28} className="mb-1" />
                <div>Pet Friendly</div>
                {pet_friendly ? <BsCheckCircle color="green" /> : <BsXCircle color="red" />}
              </div>
              <div className="col-4 mb-3">
                <FaSmoking size={28} className="mb-1" />
                <div>Smoke Friendly</div>
                {smoke_friendly ? <BsCheckCircle color="green" /> : <BsXCircle color="red" />}
              </div>
              <div className="col-4 mb-3">
                <FaCannabis size={28} className="mb-1" />
                <div>Cannabis Friendly</div>
                {cannabis_friendly ? <BsCheckCircle color="green" /> : <BsXCircle color="red" />}
              </div>
              <div className="col-4 mb-3">
                <FaUsers size={28} className="mb-1" />
                <div>Couple Friendly</div>
                {couple_friendly ? <BsCheckCircle color="green" /> : <BsXCircle color="red" />}
              </div>
              <div className="col-4 mb-3">
                <FaEnvelopeOpenText size={28} className="mb-1" />
                <div>Open to Messages</div>
                {open_to_message ? <BsCheckCircle color="green" /> : <BsXCircle color="red" />}
              </div>
            </div>

            <hr />

            {/* Edit Button */}
            {isRoommateSelf(id) && (
              <div className="text-center">
                <button
                  onClick={() => navigate(`/roommates/edit/${id}`)}
                  className="btn btn-outline-primary"
                >
                  Edit Roommate Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

}

export default RoommatesView;
