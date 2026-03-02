import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { resolveApiBase } from "./apiBase";

const API_URL = resolveApiBase();

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
