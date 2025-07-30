import { useNavigate } from "react-router-dom";

function GroupCard({ group }) {
  const navigate = useNavigate();

  // Map internal codes to readable labels & status classes you already use
  const getStatus = (code) => {
    switch (code) {
      case "O":
        return { label: "Open", cls: "status-open" };
      case "P":
        return { label: "Private", cls: "status-private" };
      case "F":
        return { label: "Filled", cls: "status-filled" };
      case "S":
        return { label: "Sent", cls: "status-sent" };
      case "U":
        return { label: "Under Review", cls: "status-review" };
      case "R":
        return { label: "Rejected", cls: "status-rejected" };
      case "I":
        return { label: "Invited", cls: "status-invited" };
      default:
        return { label: code ?? "—", cls: "" };
    }
  };

  const status = getStatus(group.group_status);

  // Optional: short, safe fallback if name/description missing
  const name = group.name?.trim() || "Untitled Group";
  const description = group.description?.trim() || "No description provided.";
  const membersCount = Array.isArray(group.members) ? group.members.length : 0;

  return (
    <article
      className="group-card is-clickable"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/groups/${group.id}`)}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && navigate(`/groups/${group.id}`)
      }
      aria-label={`Open ${name}`}
    >
      {/* Header: Title + Status */}
      <header className="gc-header">
        <h3 className="gc-title" title={name}>
          {name}
        </h3>
        <span className={`status-badge ${status.cls}`} title={status.label}>
          {status.label}
        </span>
      </header>

      {/* Description (clamped) */}
      <p className="gc-desc" title={description}>
        {description}
      </p>

      {/* Meta */}
      <div className="gc-meta">
        <div className="gc-meta-item">
          <span className="gc-meta-label">Move‑in</span>
          <span className="gc-meta-value">{group.move_in_date || "N/A"}</span>
        </div>
        <div className="gc-meta-item">
          <span className="gc-meta-label">Ready</span>
          <span
            className={`gc-chip ${
              group.move_in_ready ? "gc-chip-ok" : "gc-chip-muted"
            }`}
          >
            {group.move_in_ready ? "Yes" : "No"}
          </span>
        </div>
        <div className="gc-meta-item">
          <span className="gc-meta-label">Members</span>
          <span className="gc-chip gc-chip-info">{membersCount}</span>
        </div>
      </div>
    </article>
  );
}

export default GroupCard;
