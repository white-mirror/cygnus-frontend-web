export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "cygnus-ui-theme";

const isBrowser = (): boolean => typeof window !== "undefined";

export const resolveInitialTheme = (): Theme => {
  if (!isBrowser()) {
    return "dark";
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch {
    // Ignore storage access issues.
  }

  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "dark";
};

export const applyTheme = (theme: Theme): void => {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }

  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage write issues.
  }
};
