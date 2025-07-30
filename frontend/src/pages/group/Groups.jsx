import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import "../../styles/groups.css";
import { useProfileContext } from "../../contexts/ProfileContext";
import GroupCard from "../../components/cards/GroupCard";

function Groups() {
  const { id } = useParams();
  const [groups, setGroups] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [error, setError] = useState(null);
  const [loadingOwnerId, setLoadingOwnerId] = useState(true);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const errorRef = useRef(null);
  const navigate = useNavigate();
  const { isProfileSelf } = useProfileContext();

  const fetchGroups = async () => {
    setLoadingGroup(true);
    try {
      const response = await api.get(`/listings/${id}/groups`);
      setGroups(response.data);
    } catch (err) {
      console.error("Failed to fetch groups.", err);
      setError("Failed to fetch groups.");
    } finally {
      setLoadingGroup(false);
    }
  };

  const fetchListingOwner = async () => {
    setLoadingOwnerId(true);
    try {
      const response = await api.get(`/listings/${id}`);
      setOwnerId(response.data.owner.id);
    } catch (err) {
      console.error("Failed to get listing's owner.", err);
      setError("Failed to get listing's owner.");
    } finally {
      setLoadingOwnerId(false);
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
      {error ? (
        <div ref={errorRef} className="alert alert-danger">
          {error}
        </div>
      ) : loadingGroup || loadingOwnerId ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
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
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Groups;
