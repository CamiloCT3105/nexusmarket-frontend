import { lazy, type ComponentType, type ReactElement } from "react";
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

// Pantallas de cada rol: se descargan solo al abrirlas (code splitting). Inicio, catálogo y acceso van en el paquete principal.
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(async () => ({ default: (await load())[name] }));
}

const AdminOrderDetailPage = page(() => import("@/pages/admin/AdminOrderDetailPage"), "AdminOrderDetailPage");
const AdminOrdersPage = page(() => import("@/pages/admin/AdminOrdersPage"), "AdminOrdersPage");
const AdminReturnsPage = page(() => import("@/pages/admin/AdminReturnsPage"), "AdminReturnsPage");
const CreateUserPage = page(() => import("@/pages/admin/CreateUserPage"), "CreateUserPage");
const UserDetailPage = page(() => import("@/pages/admin/UserDetailPage"), "UserDetailPage");
const UsersPage = page(() => import("@/pages/admin/UsersPage"), "UsersPage");
const ReportsPage = page(() => import("@/pages/reports/ReportsPage"), "ReportsPage");
const CartPage = page(() => import("@/pages/buyer/CartPage"), "CartPage");
const InvoiceDetailPage = page(() => import("@/pages/buyer/InvoiceDetailPage"), "InvoiceDetailPage");
const InvoicesPage = page(() => import("@/pages/buyer/InvoicesPage"), "InvoicesPage");
const OrderDetailPage = page(() => import("@/pages/buyer/OrderDetailPage"), "OrderDetailPage");
const OrdersPage = page(() => import("@/pages/buyer/OrdersPage"), "OrdersPage");
const ProfilePage = page(() => import("@/pages/buyer/ProfilePage"), "ProfilePage");
const ReturnsPage = page(() => import("@/pages/buyer/ReturnsPage"), "ReturnsPage");
const LogisticsInventoryPage = page(() => import("@/pages/logistics/LogisticsInventoryPage"), "LogisticsInventoryPage");
const ShipmentDetailPage = page(() => import("@/pages/logistics/ShipmentDetailPage"), "ShipmentDetailPage");
const ShipmentsPage = page(() => import("@/pages/logistics/ShipmentsPage"), "ShipmentsPage");
const InventoryPage = page(() => import("@/pages/seller/InventoryPage"), "InventoryPage");
const ProductFormPage = page(() => import("@/pages/seller/ProductFormPage"), "ProductFormPage");
const SellerOrderDetailPage = page(() => import("@/pages/seller/SellerOrderDetailPage"), "SellerOrderDetailPage");
const SellerOrdersPage = page(() => import("@/pages/seller/SellerOrdersPage"), "SellerOrdersPage");
const SellerProductDetailPage = page(() => import("@/pages/seller/SellerProductDetailPage"), "SellerProductDetailPage");
const SellerProductsPage = page(() => import("@/pages/seller/SellerProductsPage"), "SellerProductsPage");
const SellerReturnsPage = page(() => import("@/pages/seller/SellerReturnsPage"), "SellerReturnsPage");

const buyer = (element: ReactElement) => <RequireRole roles={["BUYER"]}>{element}</RequireRole>;
const seller = (element: ReactElement) => <RequireRole roles={["SELLER"]}>{element}</RequireRole>;
const admin = (element: ReactElement) => <RequireRole roles={["ADMIN"]}>{element}</RequireRole>;
// El supervisor consulta las mismas pantallas que el administrador, sin acciones
const staff = (element: ReactElement) => <RequireRole roles={["ADMIN", "SUPERVISOR"]}>{element}</RequireRole>;
const shipping = (element: ReactElement) => <RequireRole roles={["LOGISTICS_OPERATOR", "ADMIN", "SUPERVISOR"]}>{element}</RequireRole>;
const invoices = (element: ReactElement) => <RequireRole roles={["BUYER", "ADMIN", "SUPERVISOR"]}>{element}</RequireRole>;

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
          {
            path: "/pedidos",
            element: (
              <ByRole
                views={{ BUYER: <OrdersPage />, SELLER: <SellerOrdersPage />, ADMIN: <AdminOrdersPage />, SUPERVISOR: <AdminOrdersPage /> }}
              />
            ),
          },
          {
            path: "/pedidos/:id",
            element: (
              <ByRole
                views={{
                  BUYER: <OrderDetailPage />,
                  SELLER: <SellerOrderDetailPage />,
                  ADMIN: <AdminOrderDetailPage />,
                  SUPERVISOR: <AdminOrderDetailPage />,
                }}
              />
            ),
          },
          { path: "/facturas", element: invoices(<InvoicesPage />) },
          { path: "/facturas/:id", element: invoices(<InvoiceDetailPage />) },
          {
            path: "/devoluciones",
            element: (
              <ByRole
                views={{
                  BUYER: <ReturnsPage />,
                  SELLER: <SellerReturnsPage />,
                  ADMIN: <AdminReturnsPage />,
                  SUPERVISOR: <AdminReturnsPage />,
                }}
              />
            ),
          },
          // Vendedor
          { path: "/productos", element: seller(<SellerProductsPage />) },
          { path: "/productos/nuevo", element: seller(<ProductFormPage />) },
          { path: "/productos/:id", element: seller(<SellerProductDetailPage />) },
          // Inventario: el vendedor ve sus bodegas; el operador logístico y el administrador, todas
          {
            path: "/inventario",
            element: (
              <ByRole
                views={{
                  SELLER: <InventoryPage />,
                  LOGISTICS_OPERATOR: <LogisticsInventoryPage />,
                  ADMIN: <LogisticsInventoryPage />,
                  SUPERVISOR: <LogisticsInventoryPage />,
                }}
              />
            ),
          },
          // Operador logístico y administrador
          { path: "/envios", element: shipping(<ShipmentsPage />) },
          { path: "/envios/:id", element: shipping(<ShipmentDetailPage />) },
          // Administrador (y supervisor, en modo consulta)
          { path: "/usuarios", element: staff(<UsersPage />) },
          { path: "/usuarios/nuevo", element: admin(<CreateUserPage />) },
          { path: "/usuarios/:id", element: staff(<UserDetailPage />) },
          { path: "/reportes", element: staff(<ReportsPage />) },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
