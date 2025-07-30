import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import GroupCard from "../../components/cards/GroupCard";
import "../../styles/groups.css";

function Applications() {
  const [applications, setApplications] = useState({
    landlord: [],
    member: [],
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("landlord"); // 'landlord' | 'member'
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get("/applications/management");
      setApplications(response.data);
    } catch (err) {
      setError("Failed to fetch applications.");
      setApplications({ landlord: [], member: [] });
      console.error("Failed to fetch applications.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // helpers
  const groupByStatus = (groups) => ({
    sent: groups.filter((g) => g.group_status === "S"),
    underReview: groups.filter((g) => g.group_status === "U"),
    invited: groups.filter((g) => g.group_status === "I"),
    open: groups.filter((g) => g.group_status === "O"),
    private: groups.filter((g) => g.group_status === "P"),
    filled: groups.filter((g) => g.group_status === "F"),
    rejected: groups.filter((g) => g.group_status === "R"),
  });

  const landlord = useMemo(
    () => groupByStatus(applications.landlord || []),
    [applications]
  );
  const member = useMemo(
    () => groupByStatus(applications.member || []),
    [applications]
  );

  const landlordTotal =
    landlord.sent.length +
    landlord.underReview.length +
    landlord.invited.length;

  const memberTotal =
    member.open.length +
    member.private.length +
    member.filled.length +
    member.sent.length +
    member.underReview.length +
    member.rejected.length +
    member.invited.length;

  const sections = useMemo(() => {
    if (activeTab === "landlord") {
      return [
        {
          key: "sent",
          label: "Sent",
          items: landlord.sent,
          badgeClass: "status-sent",
        },
        {
          key: "underReview",
          label: "Under Review",
          items: landlord.underReview,
          badgeClass: "status-review",
        },
        {
          key: "invited",
          label: "Invited",
          items: landlord.invited,
          badgeClass: "status-invited",
        },
      ];
    }
    return [
      {
        key: "open",
        label: "Open",
        items: member.open,
        badgeClass: "status-open",
      },
      {
        key: "private",
        label: "Private",
        items: member.private,
        badgeClass: "status-private",
      },
      {
        key: "filled",
        label: "Filled",
        items: member.filled,
        badgeClass: "status-filled",
      },
      {
        key: "sent",
        label: "Sent",
        items: member.sent,
        badgeClass: "status-sent",
      },
      {
        key: "underReview",
        label: "Under Review",
        items: member.underReview,
        badgeClass: "status-review",
      },
      {
        key: "rejected",
        label: "Rejected",
        items: member.rejected,
        badgeClass: "status-rejected",
      },
      {
        key: "invited",
        label: "Invited",
        items: member.invited,
        badgeClass: "status-invited",
      },
    ];
  }, [activeTab, landlord, member]);

  return (
    <div className="groups-container apps-container">
      {/* Sticky header */}
      <div className="apps-header">
        <div className="apps-title-wrap">
          <h2 className="groups-title mb-0">
            {activeTab === "landlord"
              ? "Applications Management"
              : "Group Management"}
          </h2>
          <span className="apps-total chip-strong" aria-live="polite">
            {activeTab === "landlord" ? landlordTotal : memberTotal} total
          </span>
        </div>

        <div
          className="apps-tabs"
          role="tablist"
          aria-label="Applications scope"
        >
          <button
            role="tab"
            aria-selected={activeTab === "landlord"}
            className={`apps-tab ${activeTab === "landlord" ? "active" : ""}`}
            onClick={() => setActiveTab("landlord")}
          >
            As Landlord <span className="chip">{landlordTotal}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "member"}
            className={`apps-tab ${activeTab === "member" ? "active" : ""}`}
            onClick={() => setActiveTab("member")}
          >
            As Member <span className="chip">{memberTotal}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
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
                  {sec.items.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

export default Applications;
