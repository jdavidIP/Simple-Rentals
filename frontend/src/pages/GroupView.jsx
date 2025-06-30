import React, { useEffect, useState } from "react";
import api from "../api";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../styles/groups.css";
import { useProfileContext } from "../contexts/ProfileContext";

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
        <div className="loading">Loading...</div>
      ) : (
        <>
          <h2 className="groups-title">{group.name}</h2>
          <p>
            <strong>Listing:</strong>{" "}
            {listing ? (
              <Link to={`/listings/${group.listing}`}>
                {listing.unit_number && `${listing.unit_number}, `}
                {listing.street_address}, {listing.city}, {listing.postal_code}
              </Link>
            ) : (
              "Loading listing..."
            )}
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {group.description || "No description provided."}
          </p>
          <p>
            <strong>Move-in Date:</strong> {group.move_in_date}
          </p>
          <p>
            <strong>Status:</strong> {group.group_status}
          </p>
          <p>
            <strong>Move-in Ready:</strong> {group.move_in_ready ? "Yes" : "No"}
          </p>
          <p>
            <strong>Members:</strong>
          </p>
          <ul>
            {members.length === 0 ? (
              <li>No members yet.</li>
            ) : (
              members.map((member) => {
                const fit = isListingOwner
                  ? getFitRanking(member.user?.yearly_income)
                  : null;
                return (
                  <li key={member.id}>
                    <Link to={`/profile/${member.user.id}`}>
                      {member.user?.first_name} {member.user?.last_name} (
                      {member.user?.email})
                    </Link>
                    {fit && (
                      <span
                        className="ms-2"
                        style={{
                          padding: "4px 8px",
                          borderRadius: "8px",
                          backgroundColor: fit.color,
                          color: "#fff",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                        }}
                      >
                        {fit.icon} {fit.label}
                        {fit.percent !== null && ` — ${fit.percent}% income`}
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
          <button
            className="btn btn-primary mt-3"
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
              ? "Leave Group"
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
                  className="btn btn-primary mt-3 ms-2"
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
                  className="btn btn-secondary mt-3 ms-2"
                >
                  Edit Group
                </button>
              </>
            )}

          {isOwner && !conversation && (
            <button
              onClick={handleStartConversation}
              className="btn btn-secondary mt-3 ms-2"
            >
              Start Chat
            </button>
          )}

          {conversation && isMember && (
            <button
              onClick={handleStartConversation}
              className="btn btn-secondary mt-3 ms-2"
            >
              See Chat
            </button>
          )}

          {isProfileSelf(listing.owner.id) ? (
            <>
              <button
                className="btn btn-secondary mt-3 ms-2"
                onClick={() => navigate(`/listings/${group.listing}/groups`)}
              >
                See Groups for this Listing
              </button>
              <button
                className="btn btn-secondary mt-3 ms-2"
                onClick={() => navigate(`/applications`)}
              >
                See All Applications
              </button>
              <button
                onClick={() => navigate(`/groups/manage/${group.id}`)}
                className="btn btn-secondary mt-3 ms-2"
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
              className="btn btn-secondary mt-3 ms-2"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default GroupView;
