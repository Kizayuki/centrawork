import axios from "axios";

// Arahkan ke server Node.js lokal kita
const BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Middleware otomatis untuk menyisipkan Token JWT ke setiap permintaan data
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("centrawork_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
