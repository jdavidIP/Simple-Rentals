import { useEffect, useState, useCallback } from "react";
import api from "../api";
import InvitationCard from "../components/InvitationCard";
import "../styles/groups.css";

function Invitations() {
  const [invitations, setInvitations] = useState({ received: [], sent: [] });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("received");

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await api.get("/groups/invitations");
      setInvitations(response.data);
    } catch (err) {
      setError("Failed to fetch invitations.");
      setInvitations({ received: [], sent: [] });
      console.error("Failed to fetch invitations.", err);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Helper to classify invitations
  const classifyInvitations = (invites) => ({
    pending: invites.filter((inv) => inv.accepted === null),
    accepted: invites.filter((inv) => inv.accepted === true),
    rejected: invites.filter((inv) => inv.accepted === false),
  });

  const received = classifyInvitations(invitations.received || []);
  const sent = classifyInvitations(invitations.sent || []);

  return (
    <div className="groups-container">
      <h2 className="groups-title">Group Invitations</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === "received" ? " active" : ""}`}
            onClick={() => setActiveTab("received")}
          >
            Received
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === "sent" ? " active" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Sent
          </button>
        </li>
      </ul>

      {activeTab === "received" && (
        <>
          <h4>Pending</h4>
          <div className="groups-list">
            {received.pending.length === 0 ? (
              <p>No pending invitations.</p>
            ) : (
              received.pending.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  onChange={fetchInvitations}
                />
              ))
            )}
          </div>
          <h4>Accepted</h4>
          <div className="groups-list">
            {received.accepted.length === 0 ? (
              <p>No accepted invitations.</p>
            ) : (
              received.accepted.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  onChange={fetchInvitations}
                />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "sent" && (
        <>
          <h4>Pending</h4>
          <div className="groups-list">
            {sent.pending.length === 0 ? (
              <p>No pending invitations.</p>
            ) : (
              sent.pending.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  onChange={fetchInvitations}
                />
              ))
            )}
          </div>
          <h4>Accepted</h4>
          <div className="groups-list">
            {sent.accepted.length === 0 ? (
              <p>No accepted invitations.</p>
            ) : (
              sent.accepted.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  onChange={fetchInvitations}
                />
              ))
            )}
          </div>
          <h4>Rejected</h4>
          <div className="groups-list">
            {sent.rejected.length === 0 ? (
              <p>No rejected invitations.</p>
            ) : (
              sent.rejected.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  onChange={fetchInvitations}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Invitations;
