import axios from "axios";
import { ACCESS_TOKEN } from "./constants";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const protectedRoutes = [
      "/listings/add",
      "/listings/edit",
      "/profile",
      "/profile/reviews",
    ];
    const url = new URL(config.url, config.baseURL).pathname;
    if (protectedRoutes.some((route) => url.startsWith(route))) {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
