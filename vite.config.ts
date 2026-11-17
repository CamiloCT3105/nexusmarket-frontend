import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Importaciones absolutas: "@/components/ui/Button" en lugar de "../../components/ui/Button"
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // El backend permite este origen por CORS (CORS_ORIGIN=http://localhost:5173)
    port: 5173,
    strictPort: true,
  },
});
