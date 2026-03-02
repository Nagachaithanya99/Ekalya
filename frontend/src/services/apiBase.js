const FALLBACK_API = "http://localhost:5000/api";

export const resolveApiBase = () => {
  const raw =
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL ||
    FALLBACK_API;

  const trimmed = String(raw).trim().replace(/\/+$/, "");
  if (!trimmed) return FALLBACK_API;

  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
};

export const resolveBackendOrigin = () =>
  resolveApiBase().replace(/\/api$/i, "");
