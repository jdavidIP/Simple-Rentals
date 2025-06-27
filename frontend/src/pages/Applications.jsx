import { useEffect, useState } from "react";
import api from "../api";
import GroupCard from "../components/GroupCard";
import "../styles/groups.css";

function Applications() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.get("/applications/management");
        setApplications(response.data);
      } catch (err) {
        setError("Failed to fetch applications.");
        setApplications([]);
        console.error("Failed to fetch applications.", err);
      }
    };
    fetchApplications();
  }, []);

  // Separate groups by status
  const sentGroups = applications.filter((g) => g.group_status === "S");
  const underReviewGroups = applications.filter((g) => g.group_status === "U");
  const invitedGroups = applications.filter((g) => g.group_status === "I");

  return (
    <div className="groups-container">
      <h2 className="groups-title">Applications Management</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <h4>Sent</h4>
      <div className="groups-list">
        {sentGroups.length === 0 ? (
          <p>No sent applications.</p>
        ) : (
          sentGroups.map((group) => <GroupCard key={group.id} group={group} />)
        )}
      </div>

      <h4>Under Review</h4>
      <div className="groups-list">
        {underReviewGroups.length === 0 ? (
          <p>No applications under review.</p>
        ) : (
          underReviewGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))
        )}
      </div>

      <h4>Invited</h4>
      <div className="groups-list">
        {invitedGroups.length === 0 ? (
          <p>No invited applications.</p>
        ) : (
          invitedGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))
        )}
      </div>
    </div>
  );
}

export default Applications;
