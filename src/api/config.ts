const sanitizeBaseUrl = (value?: string | null): string => {
  if (!value) {
    return "";
  }
  return value.replace(/\/+$/, "");
};

const resolveRuntimeBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const desktopConfig = window.cygnusDesktop?.config;
  return sanitizeBaseUrl(desktopConfig?.apiBaseUrl);
};

const runtimeBaseUrl = resolveRuntimeBaseUrl();
const envBaseUrl = sanitizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");

const API_ORIGIN = runtimeBaseUrl || envBaseUrl;

export const withApiOrigin = (path: string): string =>
  API_ORIGIN ? `${API_ORIGIN}${path}` : path;
