import { useParams } from "react-router-dom";
import FormRoommate from "../components/FormRoommate";
import { useEffect, useState } from "react";
import api from "../api.js";
import { useProfileContext } from "../contexts/ProfileContext.jsx";
import Unauthorized from "./Unauthorized.jsx";

function RoommatesEdit() {
  const [roommate, setRoommate] = useState(null);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const { isProfileSelf } = useProfileContext();
  const [authorized, setAuthorized] = useState(null);

  const fetchRoommate = async () => {
    try {
      const response = await api.get(`/roommates/${id}`);
      setRoommate(response.data);
    } catch (err) {
      console.error("Failed to fetch roommate.", err);
      setError(err);
    }
  };

  useEffect(() => {
    fetchRoommate();
  }, [id]);

  useEffect(() => {
    if (roommate) {
      setAuthorized(isProfileSelf(roommate.user.id));
    }
  }, [roommate]);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (roommate === null || authorized === null) {
    return <p>Loading...</p>;
  }

  return authorized ? (
    <FormRoommate method="edit" roommate={roommate} />
  ) : (
    <Unauthorized />
  );
}

export default RoommatesEdit;
