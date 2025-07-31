import { useEffect, useState } from "react";

export default function useGoogleMaps() {
  const [googleMaps, setGoogleMaps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Already loaded?
    if (window.google && window.google.maps) {
      setGoogleMaps(window.google);
      setLoading(false);
      return;
    }

    // Check if script is already added
    const existingScript = document.querySelector("#google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        setGoogleMaps(window.google);
        setLoading(false);
      });
      return;
    }

    // Add script dynamically
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setGoogleMaps(window.google);
      setLoading(false);
    };

    script.onerror = () => {
      setError("Failed to load Google Maps");
      setLoading(false);
    };

    document.body.appendChild(script);
  }, []);

  return { googleMaps, loading, error };
}