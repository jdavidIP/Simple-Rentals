import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import FormListing from "../components/FormListing.jsx";
import FormRegister from "../components/FormRegister.jsx";
import api from "../api.js";

function ProfileEdit() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profile/${id}`);
      setProfile(response.data);
    } catch (err) {
      console.error("Error fetching profile.", err);
      setError("Failed to fetch profile.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!profile) {
    return <p>Loading...</p>;
  }

  return <FormRegister method="edit" profile={profile} />;
}

export default ProfileEdit;
