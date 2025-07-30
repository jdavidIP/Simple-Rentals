import { useState, useMemo } from "react";
import { useProfileContext } from "../../contexts/ProfileContext";
import InvitationCard from "../../components/cards/InvitationCard";
import "../../styles/groups.css";

function Invitations() {
  const {
    invitations = { received: [], sent: [] },
    invitationsLoading,
    invitationsError,
    fetchInvitations,
  } = useProfileContext();

  const [activeTab, setActiveTab] = useState("received");

  // classify helper
  const classifyInvitations = (invites) => ({
    pending: invites.filter((inv) => inv.accepted === null),
    accepted: invites.filter((inv) => inv.accepted === true),
    rejected: invites.filter((inv) => inv.accepted === false),
  });

  const received = useMemo(
    () => classifyInvitations(invitations.received || []),
    [invitations.received]
  );
  const sent = useMemo(
    () => classifyInvitations(invitations.sent || []),
    [invitations.sent]
  );

  const totalCount =
    (invitations.received?.length || 0) + (invitations.sent?.length || 0);

  const tabCounts = {
    received: (invitations.received || []).length,
    sent: (invitations.sent || []).length,
  };

  const sections = useMemo(() => {
    if (activeTab === "sent") {
      return [
        {
          key: "pending",
          label: "Pending",
          items: sent.pending,
          badgeClass: "status-review",
        },
        {
          key: "accepted",
          label: "Accepted",
          items: sent.accepted,
          badgeClass: "status-open",
        },
        {
          key: "rejected",
          label: "Rejected",
          items: sent.rejected,
          badgeClass: "status-rejected",
        },
      ];
    }
    return [
      {
        key: "pending",
        label: "Pending",
        items: received.pending,
        badgeClass: "status-review",
      },
      {
        key: "accepted",
        label: "Accepted",
        items: received.accepted,
        badgeClass: "status-open",
      },
    ];
  }, [activeTab, sent, received]);

  return (
    <div className="groups-container">
      {/* Sticky header with total chip */}
      <div className="apps-header">
        <div className="apps-title-wrap">
          <h2 className="groups-title mb-0">Group Invitations</h2>
          <span className="chip-strong">{totalCount} total</span>
        </div>

        {/* Tabs */}
        <div className="apps-tabs" role="tablist" aria-label="Invitation Tabs">
          <button
            className={`apps-tab ${activeTab === "received" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "received"}
            onClick={() => setActiveTab("received")}
          >
            Received
            <span className="chip">{tabCounts.received}</span>
          </button>
          <button
            className={`apps-tab ${activeTab === "sent" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "sent"}
            onClick={() => setActiveTab("sent")}
          >
            Sent
            <span className="chip">{tabCounts.sent}</span>
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {invitationsLoading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}
      {invitationsError && (
        <div className="alert alert-danger mt-3">{invitationsError}</div>
      )}

      {/* Content */}
      <div className="apps-content">
        {sections.map((sec) => (
          <details key={sec.key} className="apps-section" open>
            <summary
              className="apps-section-summary"
              role="button"
              tabIndex={0}
            >
              <div className="apps-section-title">
                <span>{sec.label}</span>
                <span className={`status-badge ${sec.badgeClass}`}>
                  {sec.items.length}
                </span>
              </div>
              <span className="apps-chevron" aria-hidden>
                ▾
              </span>
            </summary>

            {sec.items.length === 0 ? (
              <div className="apps-empty">
                <div className="apps-empty-icon">🗂️</div>
                <div className="apps-empty-text">
                  No items in “{sec.label}”.
                </div>
              </div>
            ) : (
              <div className="groups-list apps-grid">
                {sec.items.map((inv) => (
                  <InvitationCard
                    key={inv.id}
                    invitation={inv}
                    onChange={fetchInvitations}
                  />
                ))}
              </div>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}

export default Invitations;
