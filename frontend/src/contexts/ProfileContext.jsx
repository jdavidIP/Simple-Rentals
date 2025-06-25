import { createContext, useState, useContext, useEffect } from "react";
import api from "../api"; // Make sure this import is present

const ProfileContext = createContext();

export const useProfileContext = () => {
  return useContext(ProfileContext);
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await api.get("/profile/me/");
      setProfile(res.data);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    fetchUser();
    // Listen for login event
    const handler = () => fetchUser();
    window.addEventListener("user-logged-in", handler);
    return () => window.removeEventListener("user-logged-in", handler);
  }, []);

  const isProfileSelf = (id) => {
    return id === profile.id;
  };

  const value = {
    profile,
    isProfileSelf,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
