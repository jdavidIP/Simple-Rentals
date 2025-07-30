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
      <div className="apps-header">
        <div className="apps-title-wrap">
          <h2 className="groups-title">Groups for this Listing</h2>
          <span className="chip-strong">{groups.length} found</span>
        </div>
      </div>

      {error ? (
        <div ref={errorRef} className="alert alert-danger mt-3">
          {error}
        </div>
      ) : loadingGroup || loadingOwnerId ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {!isProfileSelf(ownerId) && (
            <div className="d-flex justify-content-end mb-3">
              <button
                className="gc-btn"
                onClick={() => navigate(`/listings/${id}/groups/post`)}
              >
                Open a Group
              </button>
            </div>
          )}

          {groups.length === 0 ? (
            <div className="apps-empty">
              <div className="apps-empty-icon">👥</div>
              <p>No groups found for this listing.</p>
            </div>
          ) : (
            <section className="apps-section" open>
              <summary className="apps-section-summary">
                <span className="apps-section-title">
                  <i className="bi bi-people-fill"></i> Available Groups
                </span>
                <span className="apps-chevron">⌄</span>
              </summary>
              <div className="apps-grid">
                {groups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Groups;
