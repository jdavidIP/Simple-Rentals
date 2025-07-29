import React, { useEffect, useState } from "react";
import api from "../api";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../styles/groups.css";
import { useProfileContext } from "../contexts/ProfileContext";
import RoommateCard from "../components/RoommateCard";

function GroupView() {
  const { id } = useParams(); // group id
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [listing, setListing] = useState(null);
  const [listingOwnerId, setListingOwnerId] = useState(null);
  const [listingPrice, setListingPrice] = useState(null);
  const [conversation, setConversation] = useState(null);
  const { roommate, profile, isProfileSelf } = useProfileContext();
  const [chatIds, setChatIds] = useState([]);

  const fetchGroup = async () => {
    setLoadingGroup(true);
    try {
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
      setMembers(res.data.members || []);

      const listingRes = await api.get(`/listings/${res.data.listing}`);
      setListing(listingRes.data);
      setListingPrice(listingRes.data.price);
      setListingOwnerId(listingRes.data.owner?.id);
    } catch (err) {
      console.error("Failed to fetch group.", err);
      setError("Failed to fetch group details.");
      setListing(null);
      setListingPrice(null);
      setListingOwnerId(null);
    } finally {
      setLoadingGroup(false);
    }
  };

  const fetchConversation = async () => {
    setLoadingConversation(true);
    try {
      const existingConversations = await api.get("/conversations/");
      const participantIds = members.map((m) => String(m.user.id)).sort();
      setChatIds(participantIds);

      const existingConversation = existingConversations.data.find((conv) => {
        if (String(conv.listing.id) !== String(listing.id)) return false;
        const convParticipantIds = (conv.participants || []).map(String).sort();
        return (
          convParticipantIds.length === participantIds.length &&
          convParticipantIds.every((id, idx) => id === participantIds[idx])
        );
      });

      if (existingConversation) setConversation(existingConversation);
      else setConversation(null);
    } catch (err) {
      console.error("Failed to fetch conversation.", err);
      setError("Failed to fetch conversation.");
      setConversation(null);
    } finally {
      setLoadingConversation(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  useEffect(() => {
    if (listing && members.length > 0) fetchConversation();
  }, [listing, members]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoining(true);
    setError(null);
    try {
      await api.patch(`/groups/${id}/join`);
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
      setMembers(res.data.members || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to join group. You may already be a member or not allowed."
      );
      console.error("Failed to join group.", err);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      !window.confirm(
        isOwner
          ? "Are you sure you want to delete this group? This action cannot be undone."
          : "Are you sure you want to leave this group? You might not be allowed to rejoin."
      )
    ) {
      return;
    }

    setLeaving(true);
    try {
      isOwner
        ? await api.delete(`/groups/delete/${id}`)
        : await api.patch(`/groups/${id}/leave`);
      navigate(`/listings/${listing.id}/groups`);
    } catch (err) {
      console.error("Failed to leave / delete group.", err);
      setError("Failed to leave / delete group.", err);
    } finally {
      setLeaving(false);
    }
  };

  const handleApplication = async () => {
    setError(null);
    try {
      const payload = { group_status: "S" };
      await api.patch(`/groups/edit/${id}`, payload);
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
    } catch (err) {
      console.error("Error sending application: ", err);
      setError("Failed to send application.");
    }
  };

  const handleStartConversation = async () => {
    setError(null);
    try {
      if (conversation !== null) {
        navigate(`/conversations/${conversation.id}`);
        return;
      }
      // If not, create a new conversation
      const payload = { participants: chatIds };
      const res = await api.post(
        `/listing/${listing.id}/start_conversation`,
        payload
      );
      if (res.data && res.data.id) {
        navigate(`/conversations/${res.data.id}`);
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Failed to start conversation."
      );
    }
  };

  const isMember = profile && members.some((m) => m.user.id === profile.id);

  const isOwner = group && profile && profile.id === group.owner.user.id;

  const isListingOwner =
    profile && listingOwnerId && profile.id === listingOwnerId;

  const getFitRanking = (income) => {
    if (income == null) {
      return {
        label: "Unknown Fit",
        color: "#6c757d",
        percent: null,
        icon: "❓",
      };
    }

    if (!listingPrice || !income || !listing) return <p>Loading...</p>;

    const monthlyIncome = income / 12;
    const rentRatio = listingPrice / monthlyIncome;
    const percent = (rentRatio * 100).toFixed(1);

    if (rentRatio > 0.5) {
      return {
        label: "Bad Fit",
        color: "#dc3545",
        percent,
        icon: "❌",
      };
    } else if (rentRatio < 0.3) {
      return {
        label: "Good Fit",
        color: "#198754",
        percent,
        icon: "✅",
      };
    } else {
      return {
        label: "Okay Fit",
        color: "#ffc107",
        percent,
        icon: "🟡",
      };
    }
  };

  return (
    <div className="groups-container">
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : loadingConversation || loadingGroup ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* Header */}
          <h2 className="groups-title mb-1">{group.name}</h2>

          {/* Listing Preview */}
          <div
            className="group-section mt-3 p-3"
            role="button"
            onClick={() => navigate(`/listings/${group.listing}`)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              navigate(`/listings/${group.listing}`)
            }
            tabIndex={0}
            style={{ cursor: "pointer" }}
            aria-label="Open listing"
          >
            <h5 className="group-section-title">Listing</h5>

            {listing ? (
              <div className="d-flex align-items-center gap-3 px-1">
                {" "}
                {/* ⬅️ small inner pad */}
                {/* Thumbnail */}
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
              <div className="p-3 text-muted small">Loading listing…</div>
            )}
          </div>

          {/* Top sections: About + Details */}
          <div className="row g-4 mt-1">
            {/* About */}
            <div className="col-md-7">
              <div className="group-section">
                <h5 className="group-section-title">About this group</h5>
                <p className="mb-0 text-muted">
                  {group.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="col-md-5">
              <div className="group-section">
                <h5 className="group-section-title mb-3">Details</h5>

                <div className="row gy-2">
                  <div className="col-6">
                    <div className="meta">
                      <div className="meta-label">Move-in Date</div>
                      <div className="meta-value">
                        {group.move_in_date || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="meta">
                      <div className="meta-label">Status</div>
                      <div className="meta-value">
                        <span
                          className={`badge status-badge ${
                            group.group_status === "O"
                              ? "status-open"
                              : group.group_status === "P"
                              ? "status-pending"
                              : group.group_status === "PR"
                              ? "status-private"
                              : group.group_status === "F"
                              ? "status-filled"
                              : ""
                          }`}
                        >
                          {/* Map your internal code to label if needed */}
                          {group.group_status === "O"
                            ? "Open"
                            : group.group_status === "P"
                            ? "Pending"
                            : group.group_status === "PR"
                            ? "Private"
                            : group.group_status === "F"
                            ? "Filled"
                            : group.group_status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="meta">
                      <div className="meta-label">Move-in Ready</div>
                      <div className="meta-value">
                        <span
                          className={`badge ${
                            group.move_in_ready ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {group.move_in_ready ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="group-section mt-3">
            <h5 className="group-section-title">Group Members</h5>
            {members.length === 0 ? (
              <p className="text-muted mb-0">No members yet.</p>
            ) : (
              <div className="row g-4 justify-content-center">
                {members.map((roommate) => (
                  <RoommateCard
                    key={roommate.id}
                    roommate={roommate}
                    isListingOwner={isListingOwner}
                    getFitRanking={getFitRanking}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="action-bar d-flex flex-wrap gap-2 mt-4">
            <button
              className={`btn ${
                isOwner
                  ? "btn-danger"
                  : isMember
                  ? "btn-outline-danger"
                  : "btn-primary"
              } btn-sm`}
              onClick={
                !roommate
                  ? () => navigate("/roommates/post")
                  : isMember
                  ? handleLeave
                  : handleJoin
              }
              disabled={
                (group.group_status !== "O" && !isMember) ||
                joining ||
                leaving ||
                profile === null ||
                isListingOwner
              }
            >
              {isOwner
                ? "Delete Group"
                : isMember
                ? leaving
                  ? "Leaving..."
                  : "Leave Group"
                : group.group_status !== "O"
                ? "Group not open"
                : joining
                ? "Joining..."
                : isListingOwner
                ? "Listing is yours"
                : !roommate
                ? "Create Roommate Profile"
                : "Join Group"}
            </button>

            {isOwner &&
              (group.group_status === "O" ||
                group.group_status === "P" ||
                group.group_status === "F") && (
                <>
                  <button
                    onClick={handleApplication}
                    className="btn btn-outline-success btn-sm"
                    disabled={
                      group.group_status !== "O" &&
                      group.group_status !== "P" &&
                      group.group_status !== "F"
                    }
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => navigate(`/groups/edit/${id}`)}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Edit Group
                  </button>
                </>
              )}

            {isOwner && !conversation && (
              <button
                onClick={handleStartConversation}
                className="btn btn-outline-secondary btn-sm"
              >
                Start Chat
              </button>
            )}

            {conversation && isMember && (
              <button
                onClick={handleStartConversation}
                className="btn btn-outline-secondary btn-sm"
              >
                See Chat
              </button>
            )}

            {isProfileSelf(listing.owner.id) ? (
              <>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate(`/listings/${group.listing}/groups`)}
                >
                  See Groups for this Listing
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate(`/applications`)}
                >
                  See All Applications
                </button>
                <button
                  onClick={() => navigate(`/groups/manage/${group.id}`)}
                  className="btn btn-outline-warning btn-sm"
                  disabled={
                    group.group_status === "O" ||
                    group.group_status === "P" ||
                    group.group_status === "F"
                  }
                >
                  Manage Application
                </button>
              </>
            ) : (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default GroupView;
