import { useState } from "react";
import api from "../api.js";
import { useParams } from "react-router-dom";

function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState();
  const [listings, setListings] = useState([]);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profile/${id}`);

      setProfile(response.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to fetch profile.");
    }
  };

  const fetchListings = async () => {
    try {
      const response = await api.get(`/listings/viewAll`, {
        params: { owner: id },
      });
      setListings(response.data);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to fetch listings.");
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchListings();
  }, [id]);

  if (!profile) {
    return <p>Loading...</p>;
  }

  return <></>;
}

export default Profile;
