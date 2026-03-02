import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function useApi() {
  const { getToken } = useAuth();

  const authedApi = axios.create({
    baseURL: API_URL,
  });

  authedApi.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return authedApi;
}
