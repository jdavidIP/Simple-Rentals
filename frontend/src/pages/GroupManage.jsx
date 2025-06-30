import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useProfileContext } from "../contexts/ProfileContext";
import Unauthorized from "./Unauthorized";

function GroupManage() {
  const { id } = useParams();
  const { isProfileSelf } = useProfileContext();

  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [listing, setListing] = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingListing, setLoadingListing] = useState(true);

  const fetchGroup = async () => {
    setLoadingGroup(true);
    try {
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data);
      setSelectedStatus(""); // Reset select on group fetch
    } catch (err) {
      setError("Failed to fetch group.");
    } finally {
      setLoadingGroup(false);
    }
  };

  const fetchListing = async () => {
    setLoadingListing(true);
    try {
      if (group) {
        const response = await api.get(`/listings/${group.listing}`);
        setListing(response.data);
      }
    } catch (err) {
      setError("Failed to fetch listing.");
    } finally {
      setLoadingListing(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (group) {
      fetchListing();
    }
    // eslint-disable-next-line
  }, [group]);

  useEffect(() => {
    if (group && listing) {
      setAuthorized(isProfileSelf(listing.owner.id));
    }
    // eslint-disable-next-line
  }, [group, listing, isProfileSelf]);

  const handleStatusSelect = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    if (
      selectedStatus === "R" &&
      !window.confirm("Are you sure you want to set the status to Rejected?")
    ) {
      return;
    }
    if (
      selectedStatus === "I" &&
      !window.confirm("Are you sure you want to set the status to Invited?")
    ) {
      return;
    }
    setStatusUpdating(true);
    setError(null);
    try {
      await api.patch(`/groups/manage/${id}`, { group_status: selectedStatus });
      await fetchGroup();
      setSelectedStatus(""); // Reset select after update
      navigate(`/groups/${id}`);
    } catch (err) {
      setError("Failed to update group status.");
    }
    setStatusUpdating(false);
  };

  return (
    <div className="groups-container">
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : loadingGroup || loadingListing || authorized === null ? (
        <div className="loading">Loading...</div>
      ) : !authorized ? (
        <Unauthorized />
      ) : (
        <>
          <h2 className="groups-title">{group.name}</h2>
          <p>
            <strong>Listing:</strong>{" "}
            {listing.unit_number && `${listing.unit_number}, `}
            {listing.street_address}, {listing.city}, {listing.postal_code}
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {group.description || "No description provided."}
          </p>
          <p>
            <strong>Move-in Date:</strong> {group.move_in_date}
          </p>
          <p>
            <strong>Move-in Ready:</strong> {group.move_in_ready ? "Yes" : "No"}
          </p>
          <p>
            <strong>Members:</strong>
          </p>
          <ul>
            {group.members.length === 0 ? (
              <li>No members yet.</li>
            ) : (
              group.members.map((member) => (
                <li key={member.id}>
                  {member.user.first_name} {member.user.last_name} (
                  {member.user.email})
                </li>
              ))
            )}
          </ul>
          <div className="mt-4">
            <label htmlFor="group-status" className="form-label">
              <strong>Change Group Status:</strong>
            </label>
            <select
              id="group-status"
              className="form-select"
              value={selectedStatus}
              onChange={handleStatusSelect}
              disabled={statusUpdating}
            >
              <option value="">-- Select new status --</option>
              <option value="U">Under Review</option>
              <option value="R">Rejected</option>
              <option value="I">Invited</option>
            </select>
            <button
              className="btn btn-primary mt-2"
              onClick={handleStatusChange}
              disabled={
                statusUpdating ||
                !selectedStatus ||
                selectedStatus === group.group_status
              }
            >
              Change Status
            </button>
            <button
              className="btn btn-secondary mt-2 ms-2"
              onClick={() => navigate(`/groups/${id}`)}
            >
              Back
            </button>
          </div>
          {statusUpdating && <p>Updating status...</p>}
        </>
      )}
    </div>
  );
}

export default GroupManage;
