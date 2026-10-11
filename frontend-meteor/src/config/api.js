const rawUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? ""
    : "http://localhost:8080");

const API_URL = rawUrl.replace(/\/+$/, "");

export default API_URL;

