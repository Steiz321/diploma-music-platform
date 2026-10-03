import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000, // You can change this to any port you want
    host: true, // This enables the server to be accessible externally
    cors: true, // This enables CORS
  },
});
