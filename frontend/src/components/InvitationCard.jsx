import { useProfileContext } from "../contexts/ProfileContext";
import api from "../api";
import { useState } from "react";

function InvitationCard({ invitation, onChange }) {
  const { profile } = useProfileContext();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(invitation.accepted);
  const [error, setError] = useState(null);

  const isReceived =
    profile &&
    invitation.invited_user &&
    (invitation.invited_user === profile.roommate_profile ||
      invitation.invited_user.id === profile.roommate_profile);

  const isPending = status === null;

  const handleRespond = async (accepted) => {
    setLoading(true);
    try {
      await api.patch(`/groups/invitations/${invitation.id}/update`, {
        accepted,
      });
      await api.patch(`/groups/${invitation.group}/join`);
      setStatus(accepted);
      if (onChange) onChange(); // Notify parent to refresh
    } catch (err) {
      alert("Failed to respond to invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/groups/invitations/${invitation.id}/delete`);
      setError(null);
      if (onChange) onChange(); // Notify parent to refresh
    } catch (err) {
      setError("Failed to delete invitation.");
      console.error("Failed to delete invitation.", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-3" style={{ maxWidth: 500 }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong>Group:</strong>{" "}
            <a
              href={`/groups/${invitation.group}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {invitation.group_name}
            </a>
          </div>
        </div>
        <div>
          <strong>From:</strong> {invitation.invited_by_email}
        </div>
        <div>
          <strong>To:</strong> {invitation.invited_user_email}
        </div>
        <div>
          <strong>Created:</strong>{" "}
          {new Date(invitation.created_at).toLocaleString()}
        </div>
        {isReceived && isPending && (
          <div className="mt-3">
            <button
              className="btn btn-success me-2"
              disabled={loading}
              onClick={() => handleRespond(true)}
            >
              Accept
            </button>
            <button
              className="btn btn-danger"
              disabled={loading}
              onClick={() => handleRespond(false)}
            >
              Reject
            </button>
          </div>
        )}
        {isReceived && !isPending && (
          <div className="mt-3">
            <span>
              <strong>Status:</strong>{" "}
              {status === true ? (
                <span className="text-success">Accepted</span>
              ) : (
                <span className="text-danger">Rejected</span>
              )}
            </span>
          </div>
        )}
        {!isReceived && status !== null && (
          <div className="mt-3">
            <span>
              <strong>Status:</strong>{" "}
              {status === true ? (
                <span className="text-success">Accepted</span>
              ) : (
                <span className="text-danger">Rejected</span>
              )}
            </span>
          </div>
        )}
        {!isReceived && (
          <div className="mt-3">
            <button
              className="btn btn-outline-danger"
              disabled={loading}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        )}
        {error && <div className="alert alert-danger mt-2">{error}</div>}
      </div>
    </div>
  );
}

export default InvitationCard;
