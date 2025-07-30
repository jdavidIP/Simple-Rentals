import { useNavigate } from "react-router-dom";

function GroupCard({ group }) {
  const navigate = useNavigate();

  return (
    <div
      key={group.id}
      className="card col-12 col-sm-6 col-md-4 col-lg-3 m-3 shadow-sm position-relative"
      onClick={() => navigate(`/groups/${group.id}`)}
      style={{
        cursor: "pointer",
        transition: "transform 0.1s",
        borderRadius: "10px",
        minHeight: "100%",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div className="card-body d-flex flex-column justify-content-between">
        {/* Group Title */}
        <h5 className="card-title text-primary fw-bold text-capitalize mb-1">{group.name}</h5>
        <p className="text-muted mb-3" style={{ fontSize: "0.95rem" }}>
          {group.description || "No description provided."}
        </p>

        {/* Group Details */}
        <ul className="list-unstyled mb-3" style={{ fontSize: "0.9rem" }}>
          <li><strong>Move-in:</strong> {group.move_in_date || "N/A"}</li>
          <li><strong>Status:</strong> {group.group_status}</li>
          <li><strong>Ready:</strong> {group.move_in_ready ? "Yes" : "No"}</li>
          <li><strong>Members:</strong> {group.members.length}</li>
        </ul>

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
