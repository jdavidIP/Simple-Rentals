import React, { useEffect, useState } from "react";
import api from "../api";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../styles/groups.css";

function GroupView() {
  const { id } = useParams(); // group id
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
      setMembers(res.data.members || []);
    } catch (err) {
      setError("Failed to fetch group details.");
    }
  };
  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/profile/me/");
      setCurrentUserId(res.data.id);
    } catch {
      setCurrentUserId(null);
    }
  };

  // Fetch group details and current user id
  useEffect(() => {
    fetchGroup();
    fetchCurrentUser();
  }, [id]);

  // Join group handler
  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    try {
      await api.post(`/groups/${id}/join/`);
      // Optionally, refetch group details to update members
      const res = await api.get(`/groups/${id}/`);
      setGroup(res.data);
      setMembers(res.data.members || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to join group. You may already be a member or not allowed."
      );
    }
    setJoining(false);
  };

  // Check if user is already a member
  const isMember =
    currentUserId && members.some((m) => m.user.id === currentUserId);

  const isOwner = group && currentUserId == group.owner.user.id;

  if (error) {
    return (
      <div className="groups-container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="groups-container">
        <p>Loading group details...</p>
      </div>
    );
  }

  return (
    <div className="groups-container">
      <h2 className="groups-title">{group.name}</h2>
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
          members.map((member) => (
            <li key={member.id}>
              <Link to={`/profile/${member.user.id}`}>
                {member.user?.first_name} {member.user?.last_name} (
                {member.user?.email})
              </Link>
            </li>
          ))
        )}
      </ul>
      <button
        className="btn btn-primary mt-3"
        onClick={handleJoin}
        disabled={
          group.group_status !== "Open" ||
          joining ||
          isMember ||
          currentUserId === null
        }
      >
        {isOwner
          ? "You are the owner"
          : isMember
          ? "You are a member"
          : group.group_status !== "Open"
          ? "Group not open"
          : joining
          ? "Joining..."
          : "Join Group"}
      </button>
      {isOwner && (
        <button
          onClick={() => navigate(`/groups/edit/${id}`)}
          className="btn btn-secondary mt-3 ms-2"
        >
          Edit Group
        </button>
      )}
      <button
        className="btn btn-secondary mt-3 ms-2"
        onClick={() => navigate(`/listings/${group.listing}/groups`)}
      >
        Back
      </button>
      <></>
    </div>
  );
}

export default GroupView;
