import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api.js";
import FormListing from "../components/FormListing.jsx";

function ListingsEdit() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);

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

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!listing) {
    return <p>Loading...</p>;
  }

  return <FormListing method="edit" listing={listing} />;
}

export default ListingsEdit;
