import React from "react";
import ComingSoon from "./pages/ComingSoon";
import { BrowserRouter, Route, Routes } from "react-router-dom"
import UserLayout from "./components/Layout/UserLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
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
import ScrollToTop from "./components/Common/ScrollToTop";
import ClassesPage from "./pages/ClassesPage";
import ClassDetailsPage from "./pages/ClassDetailsPage";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import AdminMessagesPage from "./components/Admin/AdminMessagesPage";
import AdminSubscriberListPage from "./components/Admin/AdminSubscriberListPage";

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
      <BrowserRouter>
        <Toaster position="top-right" />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<UserLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
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
            <Route path="services" element={<ServicesPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminHomePage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="products/:id/edit" element={<EditProductPage />} />
            <Route path="products/add" element={<AddProductPage />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="orders/:id" element={<OrderDetailsPage />} />
            <Route path="quilting-orders" element={<QuiltingOrderManagement />} />
            <Route path="quilting-form" element={<QuiltingForm />} />
            <Route path="messages" element={<AdminMessagesPage />} />
            <Route path="subscribers" element={<AdminSubscriberListPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
