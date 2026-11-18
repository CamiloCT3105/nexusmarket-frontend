import type { ReactElement } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { ByRole, RequireAuth, RequireGuest, RequireRole } from "@/auth/guards";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { CatalogPage } from "@/pages/CatalogPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AdminOrderDetailPage } from "@/pages/admin/AdminOrderDetailPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { AdminReturnsPage } from "@/pages/admin/AdminReturnsPage";
import { CreateUserPage } from "@/pages/admin/CreateUserPage";
import { UserDetailPage } from "@/pages/admin/UserDetailPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { CartPage } from "@/pages/buyer/CartPage";
import { InvoiceDetailPage } from "@/pages/buyer/InvoiceDetailPage";
import { InvoicesPage } from "@/pages/buyer/InvoicesPage";
import { OrderDetailPage } from "@/pages/buyer/OrderDetailPage";
import { OrdersPage } from "@/pages/buyer/OrdersPage";
import { ProfilePage } from "@/pages/buyer/ProfilePage";
import { ReturnsPage } from "@/pages/buyer/ReturnsPage";
import { LogisticsInventoryPage } from "@/pages/logistics/LogisticsInventoryPage";
import { ShipmentDetailPage } from "@/pages/logistics/ShipmentDetailPage";
import { ShipmentsPage } from "@/pages/logistics/ShipmentsPage";
import { InventoryPage } from "@/pages/seller/InventoryPage";
import { ProductFormPage } from "@/pages/seller/ProductFormPage";
import { SellerOrderDetailPage } from "@/pages/seller/SellerOrderDetailPage";
import { SellerOrdersPage } from "@/pages/seller/SellerOrdersPage";
import { SellerProductDetailPage } from "@/pages/seller/SellerProductDetailPage";
import { SellerProductsPage } from "@/pages/seller/SellerProductsPage";
import { SellerReturnsPage } from "@/pages/seller/SellerReturnsPage";

const buyer = (element: ReactElement) => <RequireRole roles={["BUYER"]}>{element}</RequireRole>;
const seller = (element: ReactElement) => <RequireRole roles={["SELLER"]}>{element}</RequireRole>;
const admin = (element: ReactElement) => <RequireRole roles={["ADMIN"]}>{element}</RequireRole>;
// Envíos: el operador logístico y el administrador
const shipping = (element: ReactElement) => <RequireRole roles={["LOGISTICS_OPERATOR", "ADMIN"]}>{element}</RequireRole>;
const invoices = (element: ReactElement) => <RequireRole roles={["BUYER", "ADMIN"]}>{element}</RequireRole>;

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
          // Pedidos y devoluciones: misma ruta, pantalla según el rol
          { path: "/pedidos", element: <ByRole views={{ BUYER: <OrdersPage />, SELLER: <SellerOrdersPage />, ADMIN: <AdminOrdersPage /> }} /> },
          { path: "/pedidos/:id", element: <ByRole views={{ BUYER: <OrderDetailPage />, SELLER: <SellerOrderDetailPage />, ADMIN: <AdminOrderDetailPage /> }} /> },
          { path: "/facturas", element: invoices(<InvoicesPage />) },
          { path: "/facturas/:id", element: invoices(<InvoiceDetailPage />) },
          { path: "/devoluciones", element: <ByRole views={{ BUYER: <ReturnsPage />, SELLER: <SellerReturnsPage />, ADMIN: <AdminReturnsPage /> }} /> },
          // Vendedor
          { path: "/productos", element: seller(<SellerProductsPage />) },
          { path: "/productos/nuevo", element: seller(<ProductFormPage />) },
          { path: "/productos/:id", element: seller(<SellerProductDetailPage />) },
          // Inventario: el vendedor ve sus bodegas; el operador logístico y el administrador, todas
          { path: "/inventario", element: <ByRole views={{ SELLER: <InventoryPage />, LOGISTICS_OPERATOR: <LogisticsInventoryPage />, ADMIN: <LogisticsInventoryPage /> }} /> },
          // Operador logístico y administrador
          { path: "/envios", element: shipping(<ShipmentsPage />) },
          { path: "/envios/:id", element: shipping(<ShipmentDetailPage />) },
          // Administrador
          { path: "/usuarios", element: admin(<UsersPage />) },
          { path: "/usuarios/nuevo", element: admin(<CreateUserPage />) },
          { path: "/usuarios/:id", element: admin(<UserDetailPage />) },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
