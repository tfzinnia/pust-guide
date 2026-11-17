import axios from "axios";
import { cacheKey, canCache } from "../utils/offline";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get" && canCache(response.config.url)) {
      try {
        localStorage.setItem(
          response.config.offlineKey,
          JSON.stringify({
            data: response.data,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        /* Storage can be full or disabled. */
      }
    }
    return response;
  },
  (error) => {
    if (
      !error.response &&
      error.config?.method === "get" &&
      canCache(error.config.url)
    ) {
      try {
        const cached = JSON.parse(
          localStorage.getItem(error.config.offlineKey),
        );
        if (cached)
          return Promise.resolve({
            data: cached.data,
            config: error.config,
            headers: { "x-offline-saved-at": cached.savedAt },
            status: 200,
          });
      } catch {
        /* No usable offline copy. */
      }
    }
    if (error.response?.status === 401 && localStorage.getItem("pust_token"))
      window.dispatchEvent(new Event("pust:session-expired"));
    return Promise.reject(error);
  },
);

api.interceptors.request.use((config) => {
  config.offlineKey = cacheKey(config.url);
  const token = localStorage.getItem("pust_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
