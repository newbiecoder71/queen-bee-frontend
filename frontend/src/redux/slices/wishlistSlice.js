import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "./authSlice";

const API = import.meta.env.VITE_BACKEND_URL;

const getAuthToken = (state) =>
  state.auth.token || localStorage.getItem("userToken");

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      if (!token) return [];

      const { data } = await axios.get(`${API}/api/users/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load wishlist"
      );
    }
  }
);

export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async (productId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      if (!token) return rejectWithValue("Please log in to save favorites");

      const { data } = await axios.post(
        `${API}/api/users/wishlist/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to add favorite"
      );
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      if (!token) return rejectWithValue("Please log in to manage favorites");

      const { data } = await axios.delete(`${API}/api/users/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to remove favorite"
      );
    }
  }
);

const initialState = {
  items: [],
  hasLoaded: false,
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.hasLoaded = true;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load wishlist";
      })
      .addCase(addToWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = action.payload || "Failed to add favorite";
      })
      .addCase(removeFromWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.payload || "Failed to remove favorite";
      })
      .addCase(logout, () => initialState);
  },
});

export default wishlistSlice.reducer;
