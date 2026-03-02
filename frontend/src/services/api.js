import axios from "axios";
import { resolveApiBase } from "./apiBase";

const API_URL = resolveApiBase();

export const api = axios.create({
  baseURL: API_URL,
});

/**
 * Attach Clerk token automatically to every request
 * @param {() => Promise<string|null>} getToken
 * @returns {() => void} cleanup
 */
export const attachToken = (getToken) => {
  const id = api.interceptors.request.use(async (config) => {
    try {
      const token = await getToken?.();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    return config;
  });

  return () => api.interceptors.request.eject(id);
};

export default api;
