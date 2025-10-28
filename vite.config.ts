import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_PROXY_TARGET =
  process.env.VITE_DEV_API_PROXY ?? "http://localhost:4000";

export default defineConfig(({ mode }) => {
  const isNativeBuild = mode === "native";

  return {
    base: isNativeBuild ? "./" : "/",
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
