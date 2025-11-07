const DESKTOP_SESSION_STORAGE_KEY = "cygnus-desktop-session-token";

let inMemoryToken: string | null = null;

const isDesktopEnvironment = (): boolean =>
  typeof window !== "undefined" && Boolean(window.cygnusDesktop);

const readSessionStorageToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(DESKTOP_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
};

const ensureTokenLoaded = (): void => {
  if (inMemoryToken !== null) {
    return;
  }
  inMemoryToken = readSessionStorageToken();
};

export const storeDesktopSessionToken = (token: string | null): void => {
  if (!isDesktopEnvironment()) {
    return;
  }

  inMemoryToken = token;

  try {
    if (!token) {
      window.sessionStorage.removeItem(DESKTOP_SESSION_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(DESKTOP_SESSION_STORAGE_KEY, token);
  } catch {
    // Ignore storage issues to keep desktop login resilient.
  }
};

export const getDesktopSessionToken = (): string | null => {
  if (!isDesktopEnvironment()) {
    return null;
  }

  ensureTokenLoaded();
  return inMemoryToken;
};

export const withDesktopAuth = (init: RequestInit = {}): RequestInit => {
  const headers = new Headers(init.headers ?? {});
  const token = getDesktopSessionToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return {
    ...init,
    headers,
    credentials: "include",
  };
};

export const withDesktopSessionInUrl = (rawUrl: string): string => {
  const token = getDesktopSessionToken();
  if (!token) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    // Fallback for environments where URL constructor fails.
    const separator = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${separator}token=${encodeURIComponent(token)}`;
  }
};
