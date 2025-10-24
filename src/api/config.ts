const API_ORIGIN =
  (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export const withApiOrigin = (path: string): string =>
  API_ORIGIN ? `${API_ORIGIN}${path}` : path;
