import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        "surface-subtle": "var(--surface-subtle)",
        "border-soft": "var(--border-soft)",
        "border-strong": "var(--border-strong)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        accent: "rgb(var(--accent-color) / <alpha-value>)",
        confirm: "rgb(var(--confirm-accent, var(--accent-color)) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          '"Inter"',
          '"Segoe UI"',
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      boxShadow: {
        elevated: "var(--shadow-elevated)",
        panel: "0 16px 40px rgba(31, 48, 94, 0.14)",
        tile: "0 10px 26px rgba(31, 48, 94, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
