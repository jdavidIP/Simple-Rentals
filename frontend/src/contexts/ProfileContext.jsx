import { createContext, useState, useContext, useEffect } from "react";
import api from "../api"; // Make sure this import is present

const ProfileContext = createContext();

export const useProfileContext = () => {
  return useContext(ProfileContext);
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState([]);

  const fetchUser = async () => {
    try {
      const response = await api.get("/profile/me");
      setProfile(response.data);
    } catch (err) {
      console.error("Failed to fetch user.", err);
      setProfile(null);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get("/messages");
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to fetch messages.", err);
      setMessages([]);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get("/applications");
      setApplications(response.data);
    } catch (err) {
      console.error("Failed to fetch applications.", err);
      setApplications([]);
    }
  };

  useEffect(() => {
    fetchUser();
    // Listen for login event
    const handler = () => fetchUser();
    window.addEventListener("user-logged-in", handler);
    return () => window.removeEventListener("user-logged-in", handler);
  }, []);

  useEffect(() => {
    if (profile) {
      fetchMessages();
      fetchApplications();
    }
  }, [profile]);

  const isProfileSelf = (id) => {
    return profile && id === profile.id;
  };

  const value = {
    profile,
    applications,
    messages,
    isProfileSelf,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
