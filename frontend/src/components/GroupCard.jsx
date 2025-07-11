import { useNavigate } from "react-router-dom";

function GroupCard({ group }) {
  const navigate = useNavigate();

  return (
    <div
      className="card col-12 col-sm-6 col-md-4 col-lg-3 m-3 shadow-sm"
      key={group.id}
      onClick={() => navigate(`/groups/${group.id}`)}
      style={{ cursor: "pointer", borderRadius: "10px", transition: "transform 0.1s" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: "100%" }}>
        {/* Header */}
        <h5 className="card-title mb-2 text-primary fw-bold text-capitalize">{group.name}</h5>

        {/* Description */}
        <p className="card-text text-muted mb-3" style={{ fontSize: "0.95rem" }}>
          {group.description || "No description provided."}
        </p>

        {/* Group Details */}
        <ul className="list-unstyled mb-3" style={{ fontSize: "0.9rem" }}>
          <li><strong>Move-in Date:</strong> {group.move_in_date || "N/A"}</li>
          <li><strong>Status:</strong> {group.group_status}</li>
          <li><strong>Move-in Ready:</strong> {group.move_in_ready ? "Yes" : "No"}</li>
          <li><strong>Members:</strong> {group.members.length}</li>
        </ul>

        {/* Call to Action */}
        <div className="mt-auto">
          <button className="btn btn-outline-primary w-100">
            View Group
          </button>
        </div>
      </div>
    </div>

  );
}

export default GroupCard;
