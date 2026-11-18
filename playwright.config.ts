import { defineConfig, devices } from "@playwright/test";

// Pruebas de punta a punta contra un backend real (de desarrollo o de pruebas, nunca producción).
// Variables: E2E_API_URL (por defecto http://localhost:3000), E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD.
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // Un solo flujo con varios actores que dependen entre sí: en serie y sin reintentos que oculten fallas
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    locale: "es-CO",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Levanta el frontend apuntando al backend indicado (o reutiliza el que ya esté corriendo)
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_URL: apiUrl },
    timeout: 60_000,
  },
});
