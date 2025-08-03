import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api.js";
import "../../styles/forms.css";
import { useProfileContext } from "../../contexts/ProfileContext.jsx";
import RoommateCard from "../cards/RoommateCard.jsx";

function FormGroup({ method, group }) {
  const { id } = useParams(); // listing id for POST, group id for EDIT
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: group?.name || "",
    description: group?.description || "",
    move_in_date: group?.move_in_date || "",
    move_in_ready: group?.move_in_ready || false,
    group_status: group?.group_status[0] || "O",
    member_ids: group?.members ? group.members.map((m) => m.id) : [],
  });
  const [searchName, setSearchName] = useState("");
  const [allRoommates, setAllRoommates] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [invited, setInvited] = useState([]);
  const [error, setError] = useState(null);

  // Validation states
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { profile } = useProfileContext();
  const errorRef = useRef(null);
  const canInvite = method === "edit" && group && group.id;

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [error]);

  // Validation logic
  function validateFields(data) {
    const errors = {};
    if (!data.name || data.name.trim().length < 2)
      errors.name = "Group name must be at least 2 characters.";
    if (!data.move_in_date) errors.move_in_date = "Move-in date is required.";
    if (data.description && data.description.length > 400)
      errors.description = "Description cannot exceed 400 characters.";
    return errors;
  }

  // Handle field changes (no live validation)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Validate field on blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validationErrors = validateFields(formData);
    setFieldErrors(validationErrors);
  };

  // Error message helper
  const errMsg = (name) =>
    touched[name] && fieldErrors[name] ? (
      <div className="field-error">{fieldErrors[name]}</div>
    ) : null;

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
      params.group_id = group.id;
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

  const handleSelectChange = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions, (opt) =>
      Number(opt.value)
    );

    const selectedRoommates = selectedIds
      .map((id) => allRoommates.find((r) => r.id === id))
      .filter(Boolean); // remove any null/undefined if not found

    setSelectedToAdd(selectedRoommates);
  };

  const handleAdd = () => {
    setInvited((prev) => [
      ...prev,
      ...selectedToAdd.filter((id) => !prev.includes(id)),
    ]);
    setSelectedToAdd([]);
  };

  // Submit with full validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateFields(formData);
    setFieldErrors(validationErrors);
    setTouched(Object.fromEntries(Object.keys(formData).map((k) => [k, true])));
    if (Object.keys(validationErrors).length > 0) {
      if (errorRef.current)
        errorRef.current.scrollIntoView({ behavior: "smooth" });
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
            invited_user: roommateId.id,
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
  };

  const handleCancelInvite = (idToRemove) => {
    setInvited((prev) => prev.filter((r) => r.id !== idToRemove));
  };

  // Helper to show added members' info
  const getMemberInfo = (memberId) => {
    let roommate = allRoommates.find((r) => r.id === memberId);
    if (!roommate && group?.members) {
      roommate = group.members.find((m) => m.id === memberId);
    }
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
    <form className="form-container" onSubmit={handleSubmit}>
      <h1>{method === "edit" ? "Edit Group" : "Create a Group"}</h1>
      {error && (
        <div className="alert alert-danger" ref={errorRef}>
          {error.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
      )}

      <h5 className="form-section-title">Basic Information</h5>
      <div className="mb-3">
        <label className="form-label">Group Name</label>
        <input
          type="text"
          name="name"
          className="form-control"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errMsg("name")}
      </div>
      <div className="mb-3">
        <label className="form-label">Description</label>
        <textarea
          name="description"
          className="form-control"
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {errMsg("description")}
      </div>
      <div className="mb-3">
        <label className="form-label">Move-in Date</label>
        <input
          type="date"
          name="move_in_date"
          className="form-control"
          value={formData.move_in_date}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errMsg("move_in_date")}
      </div>
      <div className="mb-3">
        <label className="form-label">Move-in Ready</label>
        <input
          type="checkbox"
          name="move_in_ready"
          checked={formData.move_in_ready}
          onChange={handleChange}
          className="form-check-input ms-2"
          onBlur={handleBlur}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Group Status</label>
        <select
          name="group_status"
          className="form-select"
          value={formData.group_status}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        >
          <option value="O">Open</option>
          <option value="P">Private</option>
          <option value="F">Filled</option>
        </select>
      </div>

      {/* Name search and member selection */}
      {canInvite && (
        <div>
          <h5 className="form-section-title">Manage Members</h5>
          <label className="form-label">Search a user</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              className="form-control"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter name to search"
              style={{ height: "38px" }} // Ensure input height consistent
            />
            <button
              type="button"
              onClick={handleSearch}
              style={{
                backgroundColor: "#d7bba8",
                borderColor: "#d7bba8",
                height: "38px",
                padding: "0 14px",
                marginBottom: "21px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                cursor: "pointer",
                borderRadius: "4px",
                transition: "background-color 0.3s ease, color 0.3s ease",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#c19a87";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#d7bba8";
                e.currentTarget.style.color = "initial";
              }}
            >
              🔍
            </button>
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
          {(formData.member_ids.length > 0 || invited.length > 0) && (
            <div className="mb-4">
              <label className="form-label">Added Members</label>
              <div className="card-container">
                {group.members.map((member) => (
                  <div key={`member-${member.id}`} className="card-wrapper">
                    <div className="roommate-card">
                      <RoommateCard
                        roommate={member}
                        isListingOwner={false}
                        styling={true}
                      />
                      {member.id !== profile.roommate_profile && (
                        <button
                          type="button"
                          className="card-remove-btn"
                          onClick={() => handleRemoveMember(member.id)}
                          title="Remove"
                        >
                          <span className="image-remove-x">&times;</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {invited.map((member) => (
                  <div key={`invite-${member.id}`} className="card-wrapper">
                    <div className="roommate-card">
                      <RoommateCard
                        roommate={member}
                        isListingOwner={false}
                        styling={true}
                      />
                      <button
                        type="button"
                        className="card-remove-btn"
                        onClick={() => handleCancelInvite(member.id)}
                        title="Cancel Invite"
                      >
                        <span className="image-remove-x">&times;</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button type="submit" className="btn btn-primary">
        {method === "edit" ? "Save Changes" : "Create Group"}
      </button>
    </form>
  );
}

export default FormGroup;
