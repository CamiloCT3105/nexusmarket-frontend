import type { ReactElement } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth, RequireGuest, RequireRole } from "@/auth/guards";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { CatalogPage } from "@/pages/CatalogPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { CartPage } from "@/pages/buyer/CartPage";
import { InvoiceDetailPage } from "@/pages/buyer/InvoiceDetailPage";
import { InvoicesPage } from "@/pages/buyer/InvoicesPage";
import { OrderDetailPage } from "@/pages/buyer/OrderDetailPage";
import { OrdersPage } from "@/pages/buyer/OrdersPage";
import { ProfilePage } from "@/pages/buyer/ProfilePage";
import { ReturnsPage } from "@/pages/buyer/ReturnsPage";

const buyer = (element: ReactElement) => <RequireRole roles={["BUYER"]}>{element}</RequireRole>;

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
          // Comprador
          { path: "/perfil", element: buyer(<ProfilePage />) },
          { path: "/carrito", element: buyer(<CartPage />) },
          { path: "/pedidos", element: buyer(<OrdersPage />) },
          { path: "/pedidos/:id", element: buyer(<OrderDetailPage />) },
          { path: "/facturas", element: buyer(<InvoicesPage />) },
          { path: "/facturas/:id", element: buyer(<InvoiceDetailPage />) },
          { path: "/devoluciones", element: buyer(<ReturnsPage />) },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
