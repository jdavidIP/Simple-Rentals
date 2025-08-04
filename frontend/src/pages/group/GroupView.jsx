import React, { useEffect, useState } from "react";
import api from "../../api";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../../styles/group_view.css";
import { useProfileContext } from "../../contexts/ProfileContext";
import RoommateCard from "../../components/cards/RoommateCard";

function GroupView() {
  const { id } = useParams(); // group id
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [status, setStatus] = useState(null);
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

  const getStatus = (code) => {
    switch (code) {
      case "O":
        return { label: "Open", cls: "status-open" };
      case "P":
        return { label: "Private", cls: "status-private" };
      case "F":
        return { label: "Filled", cls: "status-filled" };
      case "S":
        return { label: "Sent", cls: "status-sent" };
      case "U":
        return { label: "Under Review", cls: "status-review" };
      case "R":
        return { label: "Rejected", cls: "status-rejected" };
      case "I":
        return { label: "Invited", cls: "status-invited" };
      default:
        return { label: code ?? "—", cls: "" };
    }
  };

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
      setStatus(getStatus(res.data.group_status));
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
    <div
      className="groups-container"
      style={{
        backgroundColor: "var(--wood-white)",
        border: "1px solid var(--wood-accent)",
      }}
    >
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : loadingConversation || loadingGroup ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* Header */}
          <header
            className="apps-header text-center mb-4"
            style={{ border: "1px solid var(--wood-primary)" }}
          >
            <h2 className="groups-title">{group.name}</h2>
          </header>

          <main className="px-3 pb-5">
            {/* Listing Preview */}
            <section className="group-section">
              <h5 className="group-section-title">Listing</h5>
              {listing ? (
                <section
                  className="group-section listing-preview"
                  role="button"
                  onClick={() => navigate(`/listings/${group.listing}`)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    navigate(`/listings/${group.listing}`)
                  }
                  tabIndex={0}
                  aria-label="Open listing"
                >
                  <img
                    src={
                      listing.pictures?.find((p) => p.is_primary)?.image ||
                      "/static/img/placeholder.jpg"
                    }
                    alt="Listing preview"
                  />
                  <div>
                    <h6 className="mb-1 fw-bold">
                      {`${listing.property_type} in ${listing.city}`}
                    </h6>
                    <div className="fw-bold text-price mb-1">
                      ${Number(listing.price).toLocaleString()}
                    </div>
                    <div className="text-muted small">
                      {listing.street_address}, {listing.city},{" "}
                      {listing.postal_code}
                    </div>
                  </div>
                </section>
              ) : (
                <div className="p-3 text-muted small">Loading listing…</div>
              )}
            </section>

            <div className="group-info-row">
              {/* About Group */}
              <section className="group-section about-section">
                <h5 className="group-section-title">About this group</h5>
                <div className="about-content">
                  {group.description || "No description provided."}
                </div>
              </section>

              {/* Group Details */}
              <section className="group-section group-details">
                <h5 className="group-section-title">Details</h5>
                <div className="details-list">
                  <div className="detail-item">
                    <span className="detail-label">Move-in Date:</span>
                    <span className="detail-value">
                      {group.move_in_date || "—"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Move-in Ready:</span>
                    <span className="detail-value">
                      <span
                        className={`badge ${
                          group.move_in_ready ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {group.move_in_ready ? "Yes" : "No"}
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      <span
                        className={`status-badge ${status.cls}`}
                        title={status.label}
                      >
                        {status.label}
                      </span>
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Group Members */}
            <section className="group-section">
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
            </section>
          </main>

          {/* Sticky Action Bar */}
          <footer className="action-bar">
            <button
              className={`btn ${
                isOwner
                  ? "btn-danger"
                  : isMember
                  ? "btn-outline-danger"
                  : "btn-primary"
              }`}
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

            {isOwner && ["O", "P", "F"].includes(group.group_status) && (
              <>
                <button onClick={handleApplication} className="btn btn-success">
                  Apply
                </button>
                <button
                  onClick={() => navigate(`/groups/edit/${id}`)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
              </>
            )}

            {isOwner && !conversation && (
              <button
                onClick={handleStartConversation}
                className="btn btn-secondary"
              >
                Start Chat
              </button>
            )}

            {conversation && isMember && (
              <button
                onClick={handleStartConversation}
                className="btn btn-secondary"
              >
                See Chat
              </button>
            )}

            {isProfileSelf(listing.owner.id) ? (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/listings/${group.listing}/groups`)}
                >
                  See Groups
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/applications`)}
                >
                  See Applications
                </button>
                {!["O", "P", "F"].includes(group.group_status) && (
                  <button
                    onClick={() => navigate(`/groups/manage/${group.id}`)}
                    className="btn btn-warning"
                  >
                    Manage Application
                  </button>
                )}
              </>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

export default GroupView;
