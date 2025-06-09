import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";
import FormLogIn from "../components/FormLogIn.jsx";

function Login() {
  return (
    <div>
      <FormLogIn />
    </div>
  );
}

export default Login;
