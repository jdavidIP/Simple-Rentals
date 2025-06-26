import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api.js";
import FormListing from "../components/FormListing.jsx";
import { useProfileContext } from "../contexts/ProfileContext.jsx";
import Unauthorized from "./Unauthorized.jsx";

function ListingsEdit() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);
  const { isProfileSelf } = useProfileContext();
  const [authorized, setAuthorized] = useState(null);

  // Fetch the listing data
  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      setListing(response.data);
    } catch (err) {
      console.error("Error fetching listing:", err);
      setError("Failed to fetch listing.");
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (listing) {
      setAuthorized(isProfileSelf(listing.owner.id));
    }
  }, [listing]);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  // Show loading until we know if the user is authorized
  if (listing === null || authorized === null) {
    return <p>Loading...</p>;
  }

  return authorized ? (
    <FormListing method="edit" listing={listing} />
  ) : (
    <Unauthorized />
  );
}

export default ListingsEdit;
