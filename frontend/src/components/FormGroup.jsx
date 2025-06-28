import React, { useState, useEffect, useRef, useDebugValue } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/forms.css";
import { useProfileContext } from "../contexts/ProfileContext.jsx";

function FormGroup({ method, group }) {
  const { id } = useParams(); // listing id for POST, group id for EDIT
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: group?.name || "",
    description: group?.description || "",
    move_in_date: group?.move_in_date || "",
    move_in_ready: group?.move_in_ready || false,
    group_status: group?.group_status || "O",
    member_ids: group?.members ? group.members.map((m) => m.id) : [],
  });
  const [searchName, setSearchName] = useState("");
  const [allRoommates, setAllRoommates] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [invited, setInvited] = useState([]);
  const [error, setError] = useState(null);
  const { profile } = useProfileContext();
  const errorRef = useRef(null);
  const canInvite = method === "edit" && group && group.id;

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [error]);

  // Fetch roommates by name
  const handleSearch = async (e) => {
    e.preventDefault();
    setAllRoommates([]);
    setSelectedToAdd([]);
    if (!searchName.trim()) {
      setError(["Please enter a name to search."]);
      return;
    }
    try {
      const params = {};
      if (searchName) params.name = searchName;
      const res = await api.get("/roommates/", { params });
      setAllRoommates(res.data);
      if (res.data.length === 0) {
        setError(["No roommates found with that name."]);
      } else {
        setError(null);
      }
    } catch {
      setError(["Failed to fetch roommates."]);
    }
  };

  // Handle selection in the select box
  const handleSelectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) =>
      Number(opt.value)
    );
    setSelectedToAdd(selected);
  };

  // Add selected members to the group
  const handleAdd = () => {
    setInvited((prev) => [
      ...prev,
      ...selectedToAdd.filter((id) => !prev.includes(id)),
    ]);
    setSelectedToAdd([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim()) {
      setError(["Group name is required."]);
      return;
    }
    if (!formData.move_in_date) {
      setError(["Move-in date is required."]);
      return;
    }
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        move_in_date: formData.move_in_date,
        move_in_ready: formData.move_in_ready,
        group_status: formData.group_status,
        member_ids: formData.member_ids,
      };

      if (canInvite && invited.length !== 0) {
        for (const roommateId of invited) {
          await api.post(`/groups/${id}/invite`, {
            group: group.id,
            invited_user: roommateId,
          });
        }
      }

      if (method === "post") {
        payload.listing = id;
        await api.post(`/listings/${id}/groups/post`, payload);
        navigate(`/listings/${id}/groups`);
      } else if (method === "edit") {
        await api.patch(`/groups/edit/${id}`, payload);
        navigate(`/groups/${id}`);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(
          typeof err.response.data === "string"
            ? [err.response.data]
            : Object.values(err.response.data).flat()
        );
      } else {
        setError(["Failed to submit group."]);
      }
    }
  };

  const handleRemoveMember = (memberId) => {
    setFormData((prev) => ({
      ...prev,
      member_ids: prev.member_ids.filter((id) => id !== memberId),
    }));

    setInvited((prev) => prev.filter((id) => id !== memberId));
  };

  // Helper to show added members' info
  const getMemberInfo = (memberId) => {
    // Try to find in allRoommates (from search)
    let roommate = allRoommates.find((r) => r.id === memberId);
    // If not found, try to find in group.members (for edit mode)
    if (!roommate && group?.members) {
      roommate = group.members.find((m) => m.id === memberId);
    }
    // If not found, try to find in invited (for newly invited users)
    if (!roommate && invited.length > 0) {
      roommate = allRoommates.find(
        (r) => invited.includes(r.id) && r.id === memberId
      );
    }
    if (roommate) {
      return `${roommate.user?.first_name} ${roommate.user?.last_name} (${roommate.user?.email})`;
    }
    return `User ID: ${memberId}`;
  };

  return (
    <form
      className="form-container"
      onSubmit={handleSubmit}
      style={{ maxWidth: 600, margin: "2rem auto" }}
    >
      <h2>{method === "edit" ? "Edit Group" : "Create a Group"}</h2>
      {error && (
        <div className="alert alert-danger" ref={errorRef}>
          {error.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">Group Name</label>
        <input
          type="text"
          name="name"
          className="form-control"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Description</label>
        <textarea
          name="description"
          className="form-control"
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Move-in Date</label>
        <input
          type="date"
          name="move_in_date"
          className="form-control"
          value={formData.move_in_date}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Move-in Ready</label>
        <input
          type="checkbox"
          name="move_in_ready"
          checked={formData.move_in_ready}
          onChange={handleChange}
          className="form-check-input ms-2"
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Group Status</label>
        <select
          name="group_status"
          className="form-select"
          value={formData.group_status}
          onChange={handleChange}
          required
        >
          <option value="O">Open</option>
          <option value="P">Private</option>
          <option value="F">Filled</option>
        </select>
      </div>

      {/* Name search and member selection */}
      {canInvite && (
        <>
          <div className="mb-3">
            <label className="form-label">Search Roommates by Name</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                className="form-control"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter name to search"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>
          {allRoommates.length > 0 && (
            <div className="mb-3">
              <label className="form-label">Select Members</label>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <select
                  name="members"
                  className="form-select"
                  multiple
                  value={selectedToAdd}
                  onChange={handleSelectChange}
                  style={{ flex: 1 }}
                >
                  {allRoommates.map((roommate) => (
                    <option key={roommate.id} value={roommate.id}>
                      {roommate.user?.first_name} {roommate.user?.last_name} (
                      {roommate.user?.email})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAdd}
                  disabled={selectedToAdd.length === 0}
                >
                  Add
                </button>
              </div>
              <small className="text-muted">
                Select roommates and click "Add" to include them in the group.
              </small>
            </div>
          )}
          {formData.member_ids.length > 0 || invited.length > 0 ? (
            <div className="mb-3">
              <label className="form-label">Added Members</label>
              <ul>
                {/* Existing group members */}
                {formData.member_ids.map((memberId) => (
                  <li
                    key={`member-${memberId}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {getMemberInfo(memberId)}
                    {memberId != profile.roommate_profile && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        style={{ marginLeft: "10px" }}
                        onClick={() => handleRemoveMember(memberId)}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
                {/* Invited (to be invited) users */}
                {invited.map((invitedId) => (
                  <li
                    key={`invited-${invitedId}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {getMemberInfo(invitedId)}
                    <button
                      type="button"
                      className="btn btn-sm btn-warning"
                      style={{ marginLeft: "10px" }}
                      onClick={() =>
                        setInvited((prev) =>
                          prev.filter((id) => id !== invitedId)
                        )
                      }
                    >
                      Cancel Invite
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      <button type="submit" className="btn btn-primary">
        {method === "edit" ? "Save Changes" : "Create Group"}
      </button>
    </form>
  );
}

export default FormGroup;
