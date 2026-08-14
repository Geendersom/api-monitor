import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxyTarget =
  process.env.VITE_DEV_API_PROXY ?? "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/dashboard": apiProxyTarget,
      "/monitors": apiProxyTarget,
      "/alerts": apiProxyTarget,
      "/health": apiProxyTarget,
    },
  },
});
