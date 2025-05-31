import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";
import FormReview from "../components/FormReview.jsx";

function Reviews() {
  return (
    <div>
        <Header />
        <FormReview />
    </div>
  );
}

export default Reviews;
