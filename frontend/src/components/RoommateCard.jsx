import React from "react";
import { useNavigate } from "react-router-dom";

const RoommateCard = ({ roommate, isListingOwner, getFitRanking }) => {
  const navigate = useNavigate();
  const fit = isListingOwner
    ? getFitRanking(roommate.user?.yearly_income)
    : null;

  return (
    <div
      key={roommate.id}
      className="card col-12 col-sm-6 col-md-4 col-lg-4 mb-4 shadow-sm position-relative"
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
      <img
        src={roommate.user.profile_picture || "/static/img/placeholder.jpg"}
        alt="Roommate Profile"
        className="card-img-top border-bottom mt-2"
        style={{ objectFit: "cover", aspectRatio: "4/3" }}
      />

      <div className="card-body d-flex flex-column">
        <h5 className="card-title text-capitalize mb-1">
          {roommate.user.first_name} {roommate.user.last_name}
        </h5>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <div className="text-primary fw-bold">
            Budget: ${roommate.roommate_budget.toLocaleString()}
          </div>

          {fit && (
            <span
              className="badge d-inline-block text-truncate"
              style={{
                backgroundColor: fit.color,
                color: "#fff",
                fontSize: "0.8rem",
                maxWidth: "100%",
              }}
              title={`${fit.label}${
                fit.percent !== null ? ` — ${fit.percent}%` : ""
              }`}
            >
              {fit.icon} {fit.label}
              {fit.percent !== null && ` — ${fit.percent}%`}
            </span>
          )}
        </div>

        <div className="small text-muted mb-1">
          <strong>City:</strong> {roommate.user.preferred_location || "N/A"}
        </div>
        <div className="small text-muted mb-2">
          <strong>Gender:</strong> {roommate.user.sex}
        </div>

        <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
          <strong>Description:</strong>{" "}
          {roommate.description || "No description provided."}
        </p>
      </div>
    </div>
  );
};

export default RoommateCard;
