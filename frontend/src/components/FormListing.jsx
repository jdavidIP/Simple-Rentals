import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";
import "../styles/forms.css";
import { Link } from "react-router-dom";

function FormListing({ method }) {
  const { id } = method === "edit" ? useParams() : " ";

  return <div>form {`${method} ${id}`}</div>;
}

export default FormListing;
