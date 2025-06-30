import { useParams } from "react-router-dom";
import FormRoommate from "../components/FormRoommate";
import { useEffect, useState } from "react";
import api from "../api.js";
import { useProfileContext } from "../contexts/ProfileContext.jsx";
import Unauthorized from "./Unauthorized.jsx";

function RoommatesEdit() {
  const [roommate, setRoommate] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { isRoommateSelf, profileLoading } = useProfileContext();
  const [authorized, setAuthorized] = useState(null);

  const fetchRoommate = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/roommates/${id}`);
      setRoommate(response.data);
    } catch (err) {
      console.error("Failed to fetch roommate.", err);
      setError("Failed to fetch roommate.");
      setRoommate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoommate();
  }, [id]);

  useEffect(() => {
    if (roommate) {
      setAuthorized(isRoommateSelf(roommate.id));
    }
  }, [roommate]);

  return error ? (
    <div className="alert alert-danger">{error}</div>
  ) : loading || profileLoading ? (
    <div className="loading">Loading...</div>
  ) : !authorized ? (
    <Unauthorized />
  ) : roommate ? (
    <FormRoommate method="edit" roommate={roommate} />
  ) : (
    <div>No profile found.</div>
  );
}

export default RoommatesEdit;
