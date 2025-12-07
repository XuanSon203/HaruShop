import LayoutClient from "../components/layout/LayoutClient";
import Login from "../pages/client/auth/Login";
import Register from "../pages/client/auth/Register";
import Cart from "../pages/client/cart/Cart";
import Home from "../pages/client/home/Home";
import Accessories from "../pages/client/products/accessories/Accessories";
import AccessoryDetail from "../pages/client/products/accessories/AccessoryDetail";
import Services from "../pages/client/services/Services";
import ServiceBooking from "../pages/client/services/ServiceBooking";
import Setting from "../pages/settings/Setting";
import FoodDetail from "../pages/client/products/foods/FoodDetail";
import Foods from "../pages/client/products/foods/Food";
import LayoutAdmin from "../components/layout/LayoutAdmin";
import Dashboard from "../pages/admin/dashboard/Dashboard";
import ManagerFoods from "../pages/admin/products/foods/Foods";
import ManagerAccessories from "../pages/admin/products/accessories/Accessories";
import ManagerCategory from "../pages/admin/categories/Category";
import ManagerUser from "../pages/admin/users/User";
import ManagerServices from "../pages/admin/services/Services";
import ManagerOrder from "../pages/admin/orders/Orders";
import ManagerServiceOrders from "../pages/admin/orders/ServiceOrders";
import ManagerCustormers from "../pages/admin/address/Address";
import ManagerRoles from "../pages/admin/roles/Roles";
import Revenue from "../pages/admin/revenue/Revenue";
import ManagerDiscount from "../pages/admin/discounts/Coupons";
import PermissionsPage from "../pages/admin/permissions/Permissions";
import ManagerAccount from "../pages/admin/account/Account";
import ManagerContact from "../pages/admin/contact/Contact";
import PaymentsAdmin from "../pages/admin/payments/Payments";
import ShippingAdmin from "../pages/admin/shipping/Shipping";
import SettingsAdmin from "../pages/admin/settings/SettingsWrapper";
import Orders from "../pages/client/orders/Orders";
import OrderDetail from "../pages/client/orders/OrderDetail";
import CreateOrder from "../pages/client/orders/Create";

import ServiceOrders from "../pages/client/orderServices/ServiceOrders";
import ServiceOrderDetail from "../pages/client/orderServices/ServiceOrderDetail";
import UserInfo from "../pages/client/user/UserInfo";
import Contact from "../pages/client/contact/Contact";
import LoginAdmin from "../pages/admin/auth/Login";
import ForgotPassword from "../pages/client/auth/ForgotPassword";
import VerifyOtp from "../pages/client/auth/VerifyOtp";
import ResetPassword from "../pages/client/auth/ResetPassword";
import SearchResults from "../pages/SearchResults";
import TestSearch from "../components/chat/TestSearch";
import NotFound from "../pages/client/errors/NotFound";
import AdminNotFound from "../pages/admin/errors/NotFound";
import Unauthorized from "../pages/admin/errors/Unauthorized";

export const routes = [
  {
    path: "/",
    element: <LayoutClient />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "accessories",
        element: <Accessories />,
      },
      {
        path: "accessories/:slug",
        element: <AccessoryDetail />,
      },
      {
        path: "settings",
        element: <Setting />,
      },
      {
        path: "cart",
        element: <Cart />,
      },
      {
        path: "services",
        element: <Services />,
      },
      {
        path: "services/:slug",
        element: <ServiceBooking />,
      },
      {
        path: "foods",
        element: <Foods />,
      },
      {
        path: "foods/:id",
        element: <FoodDetail />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "orders/:id",
        element: <OrderDetail />,
      },
      {
        path: "order/create",
        element: <CreateOrder />,
      },
      {
        path: "service-orders",
        element: <ServiceOrders />,
      },
      {
        path: "service-orders/:id",
        element: <ServiceOrderDetail />,
      },
      {
        path: "user/profile",
        element: <UserInfo />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "verify-otp",
        element: <VerifyOtp />,
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
      },
      {
        path: "search",
        element: <SearchResults />,
      },
      {
        path: "test-search",
        element: <TestSearch />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
  {
    path: "/admin",
    element: <LayoutAdmin />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "foods",
        element: <ManagerFoods />,
      },
      {
        path: "accessories",
        element: <ManagerAccessories />,
      },
      {
        path: "categories",
        element: <ManagerCategory />,
      },
      {
        path: "users",
        element: <ManagerUser />,
      },
      {
        path: "services",
        element: <ManagerServices />,
      },
      {
        path: "orders",
        element: <ManagerOrder />,
      },
      {
        path: "service-orders",
        element: <ManagerServiceOrders />,
      },
      {
        path: "customers",
        element: <ManagerCustormers />,
      },
      {
        path: "roles",
        element: <ManagerRoles />,
      },
      {
        path: "discounts",
        element: <ManagerDiscount />,
      },
      {
        path: "revenues",
        element: <Revenue />,
      },
      {
        path: "permissions",
        element: <PermissionsPage />,
      },
      {
        path: "accounts",
        element: <ManagerAccount />,
      },
      {
        path: "contacts",
        element: <ManagerContact />,
      },
      {
        path: "payments",
        element: <PaymentsAdmin />,
      },
      {
        path: "shipping",
        element: <ShippingAdmin />,
      },
      {
        path: "settings",
        element: <SettingsAdmin />,
      },
    ],
  },
  {
    path: "/admin/*",
    element: <AdminNotFound />,
  },
  {
    path: "/admin/auth/login",
    element: <LoginAdmin />,
  },
  {
    path: "/admin/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

