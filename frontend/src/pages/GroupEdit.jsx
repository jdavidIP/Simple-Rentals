import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormGroup from "../components/FormGroup";
import api from "../api.js";

function GroupEdit() {
  const { id } = useParams();
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);

  const fetchGroup = async () => {
    try {
      const response = await api.get(`/groups/${id}`);

      setGroup(response.data);
    } catch (err) {
      console.error("Error fetching group:", err);
      setError("Failed to fetch group.");
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!group) {
    return <p>Loading...</p>;
  }

  return <FormGroup method="edit" group={group} />;
}

export default GroupEdit;
