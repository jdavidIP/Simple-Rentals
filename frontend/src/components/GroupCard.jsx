import { useNavigate } from "react-router-dom";

function GroupCard({ group }) {
  const navigate = useNavigate();

  return (
    <div
      className="group-card"
      key={group.id}
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      <h4 className="group-name">{group.name}</h4>
      <p className="group-description">
        {group.description || "No description provided."}
      </p>
      <p>
        <strong>Move-in Date:</strong> {group.move_in_date}
      </p>
      <p>
        <strong>Status:</strong> {group.group_status}
      </p>
      <p>
        <strong>Move-in Ready:</strong> {group.move_in_ready ? "Yes" : "No"}
      </p>
      <p>
        <strong>Members:</strong> {group.members.length}
      </p>
    </div>
  );
}

export default GroupCard;
