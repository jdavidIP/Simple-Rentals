import { useEffect, useState } from "react";
import api from "../api";
import GroupCard from "../components/GroupCard";
import "../styles/groups.css";

function Applications() {
  const [applications, setApplications] = useState({
    landlord: [],
    member: [],
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("landlord");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.get("/applications/management");
        setApplications(response.data);
      } catch (err) {
        setError("Failed to fetch applications.");
        setApplications({ landlord: [], member: [] });
        console.error("Failed to fetch applications.", err);
      }
    };
    fetchApplications();
  }, []);

  // Helper to separate groups by status
  const groupByStatus = (groups) => ({
    sent: groups.filter((g) => g.group_status === "S"),
    underReview: groups.filter((g) => g.group_status === "U"),
    invited: groups.filter((g) => g.group_status === "I"),
    open: groups.filter((g) => g.group_status === "O"),
    private: groups.filter((g) => g.group_status === "P"),
    filled: groups.filter((g) => g.group_status === "F"),
    rejected: groups.filter((g) => g.group_status === "R"),
  });

  const landlordGroups = groupByStatus(applications.landlord || []);
  const memberGroups = groupByStatus(applications.member || []);

  return (
    <div className="groups-container">
      <h2 className="groups-title">Applications Management</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === "landlord" ? " active" : ""}`}
            onClick={() => setActiveTab("landlord")}
          >
            As Landlord
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === "member" ? " active" : ""}`}
            onClick={() => setActiveTab("member")}
          >
            As Member
          </button>
        </li>
      </ul>

      {activeTab === "landlord" && (
        <>
          <h4>Sent</h4>
          <div className="groups-list">
            {landlordGroups.sent.length === 0 ? (
              <p>No sent applications.</p>
            ) : (
              landlordGroups.sent.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
          <h4>Under Review</h4>
          <div className="groups-list">
            {landlordGroups.underReview.length === 0 ? (
              <p>No applications under review.</p>
            ) : (
              landlordGroups.underReview.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
          <h4>Invited</h4>
          <div className="groups-list">
            {landlordGroups.invited.length === 0 ? (
              <p>No invited applications.</p>
            ) : (
              landlordGroups.invited.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "member" && (
        <>
          <h4>Open</h4>
          <div className="groups-list">
            {memberGroups.open.length === 0 ? (
              <p>No open groups.</p>
            ) : (
              memberGroups.open.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
          <h4>Private</h4>
          <div className="groups-list">
            {memberGroups.private.length === 0 ? (
              <p>No private groups.</p>
            ) : (
              memberGroups.private.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
          <h4>Filled</h4>
          <div className="groups-list">
            {memberGroups.filled.length === 0 ? (
              <p>No filled groups.</p>
            ) : (
              memberGroups.filled.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
          <h4>Sent</h4>
          <div className="groups-list">
            {memberGroups.sent.length === 0 ? (
              <p>No sent applications.</p>
            ) : (
              memberGroups.sent.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
          <h4>Under Review</h4>
          <div className="groups-list">
            {memberGroups.underReview.length === 0 ? (
              <p>No applications under review.</p>
            ) : (
              memberGroups.underReview.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
          <h4>Rejected</h4>
          <div className="groups-list">
            {memberGroups.rejected.length === 0 ? (
              <p>No rejected applications.</p>
            ) : (
              memberGroups.rejected.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
          <h4>Invited</h4>
          <div className="groups-list">
            {memberGroups.invited.length === 0 ? (
              <p>No invited applications.</p>
            ) : (
              memberGroups.invited.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Applications;
