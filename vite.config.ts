import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/garden-room-framing/",
  server: { allowedHosts: ["terminal.local"] },
  plugins: [react()],
});
