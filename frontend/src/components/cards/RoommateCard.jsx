import React from "react";
import { useNavigate } from "react-router-dom";

const RoommateCard = ({
  roommate,
  isListingOwner,
  getFitRanking,
  styling = null,
}) => {
  const navigate = useNavigate();
  const fit = isListingOwner
    ? getFitRanking(roommate.user?.yearly_income)
    : null;

  // Helper: truncate description
  const truncate = (text, maxLength = 100) =>
    text && text.length > maxLength
      ? text.slice(0, maxLength) + "..."
      : text || "No description provided.";

  return (
    <div
      key={roommate.id}
      className={
        styling
          ? "card roommate-card shadow-sm position-relative"
          : "card col-12 col-sm-6 col-md-4 col-lg-4 mb-4 shadow-sm position-relative"
      }
      onClick={() => navigate(`/roommates/${roommate.id}`)}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-2px)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      style={{
        cursor: "pointer",
        transition: "transform 0.12s ease",
        borderRadius: "10px",
      }}
    >
      {/* Profile Picture */}
      <img
        src={roommate.user.profile_picture || "/default_profile.png"}
        alt="Roommate Profile"
        className="rounded-circle mx-auto mt-3"
        style={{
          width: "120px",
          height: "120px",
          objectFit: "cover",
          border: "3px solid #dee2e6",
        }}
      />

      {/* Card Body */}
      <div className="card-body d-flex flex-column">
        {/* Name */}
        <h5 className="card-title text-center text-capitalize mb-1">
          {roommate.user.first_name} {roommate.user.last_name}
        </h5>

        {/* Subtitle: Gender + Age */}
        <h6 className="card-subtitle text-center text-muted mb-3">
          {roommate.user.sex || "Unspecified"}
          {roommate.user.age ? ` • ${roommate.user.age} years old` : ""}
        </h6>

        {/* Budget as Pill */}
        <div className="d-flex justify-content-center mb-3">
          <span className="badge bg-primary px-3 py-2">
            💰 ${roommate.roommate_budget.toLocaleString()}
          </span>
        </div>

        {fit && (
          <div className="d-flex justify-content-center mb-3">
            <span
              className="badge"
              style={{
                backgroundColor: fit.color,
                color: "#fff",
                fontSize: "0.8rem",
              }}
              title={`${fit.label}${
                fit.percent !== null ? ` — ${fit.percent}%` : ""
              }`}
            >
              {fit.icon} {fit.label}
              {fit.percent !== null && ` — ${fit.percent}%`}
            </span>
          </div>
        )}

        {/* Description */}
        <p
          className="card-text text-muted text-center flex-grow-1"
          style={{ minHeight: "60px" }}
        >
          {truncate(roommate.description)}
        </p>
      </div>

      {/* Footer */}
      <div className="card-footer text-center text-muted small">
        Roommate looking in{" "}
        <strong>{roommate.user.preferred_location || "N/A"}</strong>
      </div>
    </div>
  );
};

export default RoommateCard;
