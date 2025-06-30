import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormGroup from "../components/FormGroup";
import api from "../api.js";
import { useProfileContext } from "../contexts/ProfileContext.jsx";
import Unauthorized from "./Unauthorized.jsx";

function GroupEdit() {
  const { id } = useParams();
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isProfileSelf } = useProfileContext();

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data);
    } catch (err) {
      console.error("Error fetching group:", err);
      setError("Failed to fetch group.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  useEffect(() => {
    if (group) {
      setAuthorized(isProfileSelf(group.owner.user.id));
    }
  }, [group]);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (group === null || authorized === null) {
    return <p>Loading...</p>;
  }

  return error ? (
    <div className="alert alert-danger">{error}</div>
  ) : loading ? (
    <div className="loading">Loading...</div>
  ) : !authorized ? (
    <Unauthorized />
  ) : group ? (
    <FormGroup method="edit" group={group} />
  ) : (
    <div>No group found.</div>
  );
}

export default GroupEdit;
