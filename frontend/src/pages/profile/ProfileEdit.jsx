import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api.js";
import { useProfileContext } from "../../contexts/ProfileContext.jsx";
import Unauthorized from "../util/Unauthorized.jsx";
import FormEdit from "../../components/forms/FormEdit.jsx";

function ProfileEdit() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isProfileSelf } = useProfileContext();
  const [authorized, setAuthorized] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/profile/${id}`);
      setProfile(response.data);
    } catch (err) {
      console.error("Error fetching profile.", err);
      setError("Failed to fetch profile.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (profile) {
      setAuthorized(isProfileSelf(profile.id));
    }
  }, [profile]);

  return error ? (
    <div className="alert alert-danger">{error}</div>
  ) : loading ? (
    <div className="loading">Loading...</div>
  ) : !authorized ? (
    <Unauthorized />
  ) : profile ? (
    <FormEdit profile={profile} />
  ) : (
    <div>No profile found.</div>
  );
}

export default ProfileEdit;
