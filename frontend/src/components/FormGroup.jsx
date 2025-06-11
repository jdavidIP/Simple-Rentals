import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

function FormGroup() {
  const { id } = useParams(); // listing id
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    move_in_date: "",
    move_in_ready: false,
    group_status: "O",
    member_ids: [],
  });
  const [searchName, setSearchName] = useState("");
  const [allRoommates, setAllRoommates] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [error, setError] = useState(null);
  const errorRef = useRef(null);

  // Handle error scroll
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
    setFormData((prev) => ({
      ...prev,
      member_ids: Array.from(new Set([...prev.member_ids, ...selectedToAdd])),
    }));
    setSelectedToAdd([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "move_in_ready") {
      setFormData((prev) => ({ ...prev, move_in_ready: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...formData,
        listing: id,
      };
      await api.post("/listings/" + id + "/groups/post", payload);
      navigate(`/listings/${id}/groups`);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(
          typeof err.response.data === "string"
            ? [err.response.data]
            : Object.values(err.response.data).flat()
        );
      } else {
        setError(["Failed to create group."]);
      }
    }
  };

  // Helper to show added members' info
  const getMemberInfo = (memberId) => {
    const roommate = allRoommates.find((r) => r.id === memberId);
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
      <h2>Create a Group</h2>
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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

      {formData.member_ids.length > 0 && (
        <div className="mb-3">
          <label className="form-label">Added Members</label>
          <ul>
            {formData.member_ids.map((memberId) => (
              <li key={memberId}>{getMemberInfo(memberId)}</li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" className="btn btn-primary">
        Create Group
      </button>
    </form>
  );
}

export default FormGroup;
