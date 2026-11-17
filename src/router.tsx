import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth, RequireGuest } from "@/auth/guards";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { CatalogPage } from "@/pages/CatalogPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { RegisterPage } from "@/pages/RegisterPage";

export const router = createBrowserRouter([
  // Acceso (solo sin sesión)
  {
    element: <RequireGuest />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/registro", element: <RegisterPage /> },
        ],
      },
    ],
  },
  // Aplicación (con sesión). Cada rol sumará sus pantallas aquí, protegidas con <RequireRole>.
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/inicio" replace /> },
          { path: "/inicio", element: <HomePage /> },
          { path: "/catalogo", element: <CatalogPage /> },
          { path: "/catalogo/:id", element: <ProductDetailPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
