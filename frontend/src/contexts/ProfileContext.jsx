import { createContext, useState, useContext, useEffect } from "react";
import api from "../api";
import { useLocation } from "react-router-dom";

const ProfileContext = createContext();

export const useProfileContext = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const location = useLocation();

  // Data states
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [roommate, setRoommate] = useState(null);
  const [favourites, setFavourites] = useState([]);

  // Loading states
  const [profileLoading, setProfileLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [roommateLoading, setRoommateLoading] = useState(true);
  const [favouritesLoading, setFavouritesLoading] = useState(true);

  // Error states
  const [profileError, setProfileError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const [applicationsError, setApplicationsError] = useState(null);
  const [invitationsError, setInvitationsError] = useState(null);
  const [roommateError, setRoommateError] = useState(null);
  const [favouritesError, setFavouritesError] = useState(null);

  const fetchUser = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await api.get("/profile/me");
      setProfile(response.data);
    } catch (err) {
      setProfile(null);
      setProfileError("Failed to fetch user.");
      console.error("Failed to fetch user.", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const response = await api.get("/messages");
      setMessages(response.data);
    } catch (err) {
      setMessages([]);
      setMessagesError("Failed to fetch messages.");
      console.error("Failed to fetch messages.", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    setApplicationsError(null);
    try {
      const response = await api.get("/applications");
      setApplications(response.data);
    } catch (err) {
      setApplications([]);
      setApplicationsError("Failed to fetch applications.");
      console.error("Failed to fetch applications.", err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const response = await api.get("/groups/invitations");
      setInvitations(response.data);
    } catch (err) {
      setInvitations([]);
      setInvitationsError("Failed to fetch invitations.");
      console.error("Failed to fetch invitations.", err);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const fetchRoommate = async () => {
    setRoommateLoading(true);
    setRoommateError(null);
    try {
      const response = await api.get(`/roommates/${profile.roommate_profile}`);
      setRoommate(response.data);
    } catch (err) {
      setRoommate(null);
      setRoommateError("Failed to fetch roommate profile.");
      console.error("Failed to fetch roommate profile.", err);
    } finally {
      setRoommateLoading(false);
    }
  };

  const fetchFavourites = async () => {
    setFavouritesLoading(true);
    setFavouritesError(null);
    try {
      const response = await api.get("/favourites");
      setFavourites(response.data.favorite_listings);
    } catch (err) {
      setFavourites(null);
      setFavouritesError("Failed to fetch favourites.");
      console.error("Failed to fetch favourites.", err);
    } finally {
      setFavouritesLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    const handler = () => fetchUser();
    window.addEventListener("user-logged-in", handler);
    return () => window.removeEventListener("user-logged-in", handler);
  }, []);

  useEffect(() => {
    if (profile && !profileLoading) {
      fetchMessages();
      fetchRoommate();
      fetchFavourites();
    }
  }, [profile]);

  useEffect(() => {
    if (roommate && !roommateLoading) {
      fetchApplications();
      fetchInvitations();
      console.log(favourites);
    }
  }, [roommate]);

  useEffect(() => {
    fetchUser();
  }, [location]);

  const isProfileSelf = (id) => profile && id === profile.id;
  const isRoommateSelf = (id) => profile && profile.roommate_profile == id;

  const addToFavourites = async (listingId) => {
    setFavouritesLoading(true);
    setFavouritesError(null);
    try {
      api.post(`/favourites/add/${listingId}`);
      setFavourites((prev) => [...prev, listingId]);
      console.log(favourites);
    } catch (err) {
      setFavouritesError("Failed to add to favourites.");
      console.error("Failed to add to favourites.", err);
    } finally {
      setFavouritesLoading(false);
    }
  };
  const removeFromFavourites = async (listingId) => {
    setFavouritesLoading(true);
    setFavouritesError(false);
    try {
      api.delete(`/favourites/remove/${listingId}`);
      setFavourites((prev) => prev.filter((listing) => listing !== listingId));
    } catch (err) {
      setFavouritesError("Failed to remove from favourites.");
      console.error("Failed to remove from favourites.", err);
    } finally {
      setFavouritesLoading(false);
    }
  };
  const isFavourite = (listingId) => {
    return favourites.some((listing) => listing === listingId);
  };

  const value = {
    profile,
    profileLoading,
    profileError,
    messages,
    messagesLoading,
    messagesError,
    applications,
    applicationsLoading,
    applicationsError,
    invitations,
    invitationsLoading,
    invitationsError,
    roommate,
    roommateLoading,
    roommateError,
    favourites,
    favouritesLoading,
    favouritesError,
    isProfileSelf,
    isRoommateSelf,
    isFavourite,
    addToFavourites,
    removeFromFavourites,
    fetchUser,
    fetchMessages,
    fetchApplications,
    fetchInvitations,
    fetchRoommate,
    fetchFavourites,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
