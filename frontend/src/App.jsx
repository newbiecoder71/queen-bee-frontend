import React from "react";
import ComingSoon from "./pages/ComingSoon";
import { BrowserRouter, Route, Routes } from "react-router-dom"
import UserLayout from "./components/Layout/UserLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { Toaster } from "sonner";
import CollectionPage from "./pages/CollectionPage";
import ProductDetails from "./components/Products/ProductDetails";
import Checkout from "./components/Cart/Checkout";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminHomePage from "./pages/AdminHomePage";
import UserManagement from "./components/Admin/UserManagement";
import ProductManagement from "./components/Admin/ProductManagement";
import EditProductPage from "./components/Admin/EditProductPage";
import AddProductPage from "./components/Admin/AddProductPage";
import OrderManagement from "./components/Admin/OrderManagement";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import QuiltingOrderManagement from "./components/Admin/QuiltingOrderManagement";
import MyQuiltsPage from "./pages/MyQuiltsPage";
import MyQuiltsDetailsPage from "./pages/MyQuiltsDetailsPage";
import QuiltingForm from "./components/Quilting/QuiltingForm";
import ContactPage from "./pages/ContactPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import ScrollToTop from "./components/Common/ScrollToTop";
import ClassesPage from "./pages/ClassesPage";
import ClassDetailsPage from "./pages/ClassDetailsPage";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import RewardsProgramPage from "./pages/RewardsProgramPage";
import AdminMessagesPage from "./components/Admin/AdminMessagesPage";
import AdminSubscriberListPage from "./components/Admin/AdminSubscriberListPage";
import PosManagement from "./components/Admin/PosManagement";
import CustomerRewardsPage from "./components/Admin/CustomerRewardsPage";
import TimeClockManagement from "./components/Admin/TimeClockManagement";
import EmployeeTrackingPage from "./components/Admin/EmployeeTrackingPage";
import EmployeeSettingsPage from "./components/Admin/EmployeeSettingsPage";
import EmployeeManagementPage from "./components/Admin/EmployeeManagementPage";
import CustomerManagementPage from "./components/Admin/CustomerManagementPage";
import AdminIndexRedirect from "./components/Admin/AdminIndexRedirect";
import AdminGiftCardsPage from "./components/Admin/AdminGiftCardsPage";
import AdminThemePage from "./components/Admin/AdminThemePage";
import AdminNewslettersPage from "./components/Admin/AdminNewslettersPage";
import { ThemeProvider } from "./context/ThemeContext";

import { Provider } from "react-redux";
import store from "./redux/store";

const App = () => {
  // 🔒 Launch guard -- This block of code is used when site needs maintenance in the future.  You just change the env var in Vercel to false.
  const isProd = import.meta.env.PROD;
  const liveSite = String(import.meta.env.VITE_LIVE_SITE).toLowerCase() === "true";

  // Force Coming Soon in production until you flip VITE_LIVE_SITE=true
  if (isProd && !liveSite) {
    return (
      <Provider store={store}>
        <ComingSoon />
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <ScrollToTop />
          <Routes>
          <Route path="/" element={<UserLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="profile" element={<Profile />} />
            <Route path="collections/:collection" element={<CollectionPage />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="orders/:id" element={<OrderDetailsPage />} />
            <Route path="my-orders" element={<MyOrdersPage />} />
            <Route path="my-quilts" element={<MyQuiltsPage />} />
            <Route path="my-quilts/:id" element={<MyQuiltsDetailsPage />} />
            <Route path="quilting-form" element={<QuiltingForm />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="classes/:id" element={<ClassDetailsPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="access-denied" element={<AccessDeniedPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="rewards-program" element={<RewardsProgramPage />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminIndexRedirect />} />
            <Route path="dashboard" element={<ProtectedRoute role="admin"><AdminHomePage /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute role="admin"><UserManagement /></ProtectedRoute>} />
            <Route path="employees" element={<ProtectedRoute role="admin"><EmployeeManagementPage /></ProtectedRoute>} />
            <Route path="customers" element={<ProtectedRoute role="admin"><CustomerManagementPage /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute role="admin"><EmployeeSettingsPage /></ProtectedRoute>} />
            <Route path="products" element={<ProtectedRoute role="admin"><ProductManagement /></ProtectedRoute>} />
            <Route path="products/:id/edit" element={<ProtectedRoute role="admin"><EditProductPage /></ProtectedRoute>} />
            <Route path="products/add" element={<ProtectedRoute role="admin"><AddProductPage /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute role="admin"><OrderManagement /></ProtectedRoute>} />
            <Route path="orders/:id" element={<ProtectedRoute role="admin"><OrderDetailsPage /></ProtectedRoute>} />
            <Route path="pos" element={<ProtectedRoute role="admin"><PosManagement /></ProtectedRoute>} />
            <Route path="gift-cards" element={<ProtectedRoute role="admin"><AdminGiftCardsPage /></ProtectedRoute>} />
            <Route path="theme" element={<ProtectedRoute role="admin"><AdminThemePage /></ProtectedRoute>} />
            <Route path="newsletters" element={<ProtectedRoute role="admin"><AdminNewslettersPage /></ProtectedRoute>} />
            <Route path="time-clock" element={<ProtectedRoute role="admin"><TimeClockManagement /></ProtectedRoute>} />
            <Route path="time-clock-tracking" element={<ProtectedRoute role="admin"><EmployeeTrackingPage /></ProtectedRoute>} />
            <Route path="customer-rewards" element={<ProtectedRoute role="admin"><CustomerRewardsPage /></ProtectedRoute>} />
            <Route path="quilting-orders" element={<ProtectedRoute role="admin"><QuiltingOrderManagement /></ProtectedRoute>} />
            <Route path="quilting-form" element={<ProtectedRoute role="admin"><QuiltingForm /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute role="admin"><AdminMessagesPage /></ProtectedRoute>} />
            <Route path="subscribers" element={<ProtectedRoute role="admin"><AdminSubscriberListPage /></ProtectedRoute>} />
          </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
