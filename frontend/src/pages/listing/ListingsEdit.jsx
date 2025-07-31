import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api.js";
import FormListing from "../../components/forms/FormListing.jsx";
import { useProfileContext } from "../../contexts/ProfileContext.jsx";
import Unauthorized from "../util/Unauthorized.jsx";

function ListingsEdit() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isProfileSelf } = useProfileContext();
  const [authorized, setAuthorized] = useState(null);

  // Fetch the listing data
  const fetchListing = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/listings/${id}`);
      setListing(response.data);
    } catch (err) {
      console.error("Error fetching listing:", err);
      setError("Failed to fetch listing.");
    } finally {
      setLoading(false);
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

  return error ? (
    <div className="alert alert-danger">{error}</div>
  ) : loading ? (
    <div className="loading">Loading...</div>
  ) : !authorized ? (
    <Unauthorized />
  ) : listing ? (
    <FormListing method="edit" listing={listing} />
  ) : (
    <div>No listing found.</div>
  );
}

export default ListingsEdit;
