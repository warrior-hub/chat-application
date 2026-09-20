
import axios from "axios";

const api = axios.create({
  baseURL: "https://chat-application-t21p.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("chat_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
