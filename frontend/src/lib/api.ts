// frontend/src/lib/api.ts
import axios from "axios";
import { getToken } from "../shared/auth/session";

function resolveBaseURL() {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  // Fallback: mesmo host do frontend (Nginx já expõe /api)
  if (!envUrl) return "/api";

  // Remove barra final
  const cleaned = envUrl.replace(/\/$/, "");

  // ✅ Se o cara já colocou .../api no env, não duplica
  if (cleaned.endsWith("/api")) return cleaned;

  // ✅ Se colocou só o host (https://regif.com.br), acrescenta /api
  return cleaned + "/api";
}

export const api = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
