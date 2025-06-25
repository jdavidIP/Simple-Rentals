import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/groups.css";
import { useProfileContext } from "../contexts/ProfileContext";

function Groups() {
  const { id } = useParams();
  const [groups, setGroups] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [error, setError] = useState(null);
  const errorRef = useRef(null);
  const navigate = useNavigate();
  const { isProfileSelf } = useProfileContext();

  const fetchGroups = async () => {
    try {
      const response = await api.get(`/listings/${id}/groups`);
      setGroups(response.data);
    } catch (err) {
      setError("Failed to fetch groups.");
    }
  };

  const fetchListingOwner = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      setOwnerId(response.data.owner.id);
    } catch (err) {
      console.error(err);
      setError("Failed to get listing's owner.");
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchListingOwner();
  }, [id]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [error]);

  return (
    <div className="groups-container">
      <h2 className="groups-title">Groups for this Listing</h2>
      {error && (
        <div ref={errorRef} className="alert alert-danger">
          {error}
        </div>
      )}
      {!isProfileSelf(ownerId) && (
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate(`/listings/${id}/groups/post`)}
        >
          Open a Group
        </button>
      )}
      {groups.length === 0 ? (
        <p className="text-muted text-center">
          No groups found for this listing.
        </p>
      ) : (
        <div className="groups-list">
          {groups.map((group) => (
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
                <strong>Move-in Ready:</strong>{" "}
                {group.move_in_ready ? "Yes" : "No"}
              </p>
              <p>
                <strong>Members:</strong> {group.members.length}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Groups;
