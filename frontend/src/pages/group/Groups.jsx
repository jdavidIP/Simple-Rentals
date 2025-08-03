import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import "../../styles/groups.css";
import { useProfileContext } from "../../contexts/ProfileContext";
import GroupCard from "../../components/cards/GroupCard";

function Groups() {
  const { id } = useParams();
  const [groups, setGroups] = useState([]);
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);
  const [loadingListing, setLoadingListing] = useState(true);
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

  const fetchListing = async () => {
    setLoadingListing(true);
    try {
      const response = await api.get(`/listings/${id}`);
      setListing(response.data);
    } catch (err) {
      console.error("Failed to get listing's owner.", err);
      setError("Failed to get listing's owner.");
    } finally {
      setLoadingListing(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [error]);

  return (
    <div className="groups-container">
      <div className="apps-header">
        <div
          className="group-section mt-3 p-3"
          role="button"
          onClick={() => navigate(`/listings/${listing.id}`)}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            navigate(`/listings/${listing.id}`)
          }
          tabIndex={0}
          style={{ cursor: "pointer" }}
          aria-label="Open listing"
        >
          <h5 className="group-section-title">Listing</h5>
          {listing ? (
            <div className="d-flex align-items-center gap-3 px-1">
              {" "}
              <div
                className="rounded overflow-hidden flex-shrink-0"
                style={{
                  width: 160,
                  height: 106,
                  background: "#f1f3f5",
                  border: "1px solid #e9ecef",
                }}
              >
                <img
                  src={
                    listing.pictures?.find((p) => p.is_primary)?.image ||
                    "/static/img/placeholder.jpg"
                  }
                  alt="Listing preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              {/* Text content */}
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="mb-1 me-2">
                    {`${listing.property_type} for Rent in ${listing.city}`}
                  </h6>
                  <div
                    className="fw-bold text-primary ms-2"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    ${Number(listing.price).toLocaleString()}
                  </div>
                </div>

                <div className="text-muted small">
                  {listing.street_address}, {listing.city},{" "}
                  {listing.postal_code}
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div ref={errorRef} className="alert alert-danger mt-3">
          {error}
        </div>
      ) : loadingGroup || loadingListing ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {!isProfileSelf(listing.owner.id) && (
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
                <span className="chip-strong">{groups.length} found</span>
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
