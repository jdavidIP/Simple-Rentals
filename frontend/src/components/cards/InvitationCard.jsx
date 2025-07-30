import { useProfileContext } from "../../contexts/ProfileContext";
import api from "../../api";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

function InvitationCard({ invitation, onChange }) {
  const { profile } = useProfileContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(invitation.accepted);
  const [error, setError] = useState(null);

  // Is this invitation addressed to the current user?
  const isReceived =
    profile &&
    invitation.invited_user &&
    (invitation.invited_user === profile.roommate_profile ||
      invitation.invited_user?.id === profile.roommate_profile);

  const isPending = status === null;

  const state = useMemo(() => {
    if (status === true) {
      return { key: "accepted", label: "Accepted", badgeClass: "status-open" };
    }
    if (status === false) {
      return {
        key: "rejected",
        label: "Rejected",
        badgeClass: "status-rejected",
      };
    }
    return { key: "pending", label: "Pending", badgeClass: "status-review" };
  }, [status]);

  const handleRespond = async (accepted) => {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/groups/invitations/${invitation.id}/update`, {
        accepted,
      });
      if (accepted) {
        // Only join when accepted
        await api.patch(`/groups/${invitation.group}/join`);
      }
      setStatus(accepted);
      onChange?.();
    } catch (err) {
      setError("Failed to respond to invitation.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/groups/invitations/${invitation.id}/delete`);
      onChange?.();
    } catch (err) {
      setError("Failed to delete invitation.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openGroup = (e) => {
    e?.stopPropagation?.();
    navigate(`/groups/${invitation.group}`);
  };

  return (
    <div
      className="group-card is-clickable"
      onClick={openGroup}
      role="button"
      aria-label={`Open group ${invitation.group_name}`}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openGroup(e)}
    >
      {/* Header */}
      <div className="gc-header">
        <h3
          className="gc-title mb-0 text-truncate"
          title={invitation.group_name}
        >
          {invitation.group_name}
        </h3>
        <span
          className={`status-badge ${state.badgeClass}`}
          title={`Status: ${state.label}`}
        >
          {state.label}
        </span>
      </div>

      {/* Meta grid */}
      <div className="d-flex flex-wrap align-items-center gap-3">
        <div className="d-flex align-items-baseline gap-1">
          <span className="gc-meta-label">From:</span>
          <span className="gc-meta-value" style={{ overflowWrap: "anywhere" }}>
            {invitation.invited_by_email}
          </span>
        </div>

        <div className="d-flex align-items-baseline gap-1">
          <span className="gc-meta-label">To:</span>
          <span className="gc-meta-value" style={{ overflowWrap: "anywhere" }}>
            {invitation.invited_user_email}
          </span>
        </div>

        <div className="d-flex align-items-baseline gap-1">
          <span className="gc-meta-label">Created:</span>
          <span className="gc-meta-value">
            {new Date(invitation.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Footer / CTAs */}
      <div className="gc-footer" onClick={(e) => e.stopPropagation()}>
        {isReceived && isPending ? (
          <>
            <button
              className="btn btn-success btn-compact"
              onClick={() => handleRespond(true)}
              disabled={loading}
              aria-label="Accept invitation"
            >
              Accept
            </button>

            <button
              className="btn btn-danger btn-compact ms-2"
              onClick={() => handleRespond(false)}
              disabled={loading}
              aria-label="Reject invitation"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            {/* Sender (or receiver after decision) controls */}
            {!isReceived && status !== null ? (
              <button
                className="btn btn-outline-danger btn-compact me-2"
                onClick={handleDelete}
                disabled={loading}
                aria-label="Delete invitation"
              >
                Delete
              </button>
            ) : null}
          </>
        )}
        <button
          className="btn btn-secondary btn-compact ms-2"
          onClick={openGroup}
          disabled={loading}
          aria-label="View group"
        >
          View Group
        </button>
      </div>

      {error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}
    </div>
  );
}

export default InvitationCard;
