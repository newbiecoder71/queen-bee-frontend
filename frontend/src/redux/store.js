import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import cartReducer from './slices/cartSlice';
import checkoutReducer from './slices/checkoutSlice';
import orderReducer from './slices/orderSlice';
import adminReducer from './slices/adminSlice';
import adminProductReducer from './slices/adminProductSlice';
import adminOrdersReducer from './slices/adminOrderSlice';
import adminQuiltingOrderReducer from "./slices/adminQuiltingOrderSlice";
import quiltingOrderReducer from "./slices/quiltingOrderSlice";
import classesReducer from "./slices/classesSlice";
import messagesReducer from "./slices/messagesSlice";
import newsletterReducer from "./slices/newsletterSlice";
import wishlistReducer from "./slices/wishlistSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    checkout: checkoutReducer,
    orders: orderReducer,
    admin: adminReducer,
    adminProducts: adminProductReducer,
    adminOrders: adminOrdersReducer,
    adminQuiltingOrders: adminQuiltingOrderReducer,
    quiltingOrders: quiltingOrderReducer,
    classes: classesReducer,
    messages: messagesReducer,
    newsletter: newsletterReducer,
    wishlist: wishlistReducer,
  },
});

export default store;
