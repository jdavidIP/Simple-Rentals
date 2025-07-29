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
      <div className="card mx-auto shadow-sm" style={{ maxWidth: 720 }}>
        {error ? (
          <div className="alert alert-danger">{error}</div>
        ) : loading || profileLoading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <div className="card-body p-4">
            {/* Header */}
            <div className="text-center mb-4">
              <img
                src={user?.profile_picture || "/static/img/placeholder.jpg"}
                alt="Profile"
                className="rounded-circle border"
                style={{ width: 120, height: 120, objectFit: "cover" }}
              />
              <h3 className="mt-3">
                <Link
                  to={`/profile/${user?.id}`}
                  className="text-decoration-none text-dark"
                >
                  {user?.first_name} {user?.last_name}
                </Link>
              </h3>
              <p className="text-muted">
                {occupation || "Occupation not specified"}
              </p>
            </div>

            {/* About Me */}
            <div className="mb-4">
              <h5 className="fw-bold" style={{ color: "#003366" }}>
                🗒️ About Me
              </h5>
              <p className="text-muted">
                {description || "No personal description provided."}
              </p>
            </div>

            <hr className="my-4" />

            {/* Key Info */}

            <h5 className="fw-bold" style={{ color: "#003366" }}>
              📌 Key Info
            </h5>
            <div className="mb-4 text-center">
              <div className="row g-3 mt-3 justify-content-center">
                <div className="col-6 col-md-4">
                  <div className="fw-bold" style={{ color: "#003366" }}>
                    Preferred Area
                  </div>
                  <div>{user?.preferred_location || "N/A"}</div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="fw-bold">Budget</div>
                  <div>${roommate_budget?.toLocaleString() || "N/A"}</div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="fw-bold">Move-in Date</div>
                  <div>{move_in_date || "N/A"}</div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="fw-bold">Stay Length</div>
                  <div>{stay_length ? `${stay_length} months` : "N/A"}</div>
                </div>
                <div className="col-6">
                  <div className="fw-bold">Gender Preference</div>
                  <div>{gender_preference || "No preference specified"}</div>
                </div>
              </div>
            </div>

            <hr className="my-4" />

            {/* Lifestyle Preferences */}

            <h5 className="fw-bold" style={{ color: "#003366" }}>
              🌿 Lifestyle Preferences
            </h5>
            <div className="mb-4 text-center">
              <div className="row g-3 mt-3 justify-content-center">
                {[
                  {
                    label: "Pet Friendly",
                    icon: <FaDog />,
                    value: pet_friendly,
                  },
                  {
                    label: "Smoke Friendly",
                    icon: <FaSmoking />,
                    value: smoke_friendly,
                  },
                  {
                    label: "Cannabis Friendly",
                    icon: <FaCannabis />,
                    value: cannabis_friendly,
                  },
                  {
                    label: "Couple Friendly",
                    icon: <FaUsers />,
                    value: couple_friendly,
                  },
                  {
                    label: "Open to Messages",
                    icon: <FaEnvelopeOpenText />,
                    value: open_to_message,
                  },
                ].map((item, idx) => (
                  <div className="col-6 col-md-4 text-center" key={idx}>
                    <div className="border rounded py-3 px-2 h-100 d-flex flex-column align-items-center">
                      <div className="fs-4 mb-2 text-secondary">
                        {item.icon}
                      </div>
                      <div className="fw-bold small">{item.label}</div>
                      <span className={"badge mt-1"}>
                        {item.value ? (
                          <BsCheckCircle color="green" size={20} />
                        ) : (
                          <BsXCircle color="red" size={20} />
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            {isRoommateSelf(id) && (
              <>
                <hr className="my-4" />
                <div className="text-center">
                  <button
                    onClick={() => navigate(`/roommates/edit/${id}`)}
                    className="btn btn-outline-primary"
                  >
                    Edit Roommate Profile
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoommatesView;
