import { useParams } from "react-router-dom";
import FormRoommate from "../components/FormRoommate";
import { useEffect, useState } from "react";
import api from "../api.js";

function RoommatesEdit() {
  const [roommate, setRoommate] = useState(null);
  const [error, setError] = useState(null);
  const { id } = useParams();

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

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!roommate) {
    return <p>Loading...</p>;
  }

  return <FormRoommate method="edit" roommate={roommate} />;
}

export default RoommatesEdit;
