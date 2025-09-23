import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch all quilting orders (Admin only)
export const fetchAdminQuiltingOrders = createAsyncThunk(
  "adminQuiltingOrders/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/quilting-orders`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Admin fetch quilting orders error:", error);
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

// Update a quilting order (e.g. mark as paid, update status)
export const updateQuiltingOrder = createAsyncThunk(
  "adminQuiltingOrders/update",
  async ({ quiltingOrderId, updates }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/quilting-orders/${quiltingOrderId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Admin update quilting order error:", error);
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

const adminQuiltingOrderSlice = createSlice({
  name: "adminQuiltingOrders",
  initialState: {
    quiltingOrders: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Local state update (optional)
    markPaidLocally: (state, action) => {
      const order = state.quiltingOrders.find((o) => o._id === action.payload);
      if (order) order.isPaid = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all quilting orders
      .addCase(fetchAdminQuiltingOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminQuiltingOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.quiltingOrders = action.payload;
      })
      .addCase(fetchAdminQuiltingOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update a quilting order
      .addCase(updateQuiltingOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuiltingOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.quiltingOrders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) state.quiltingOrders[index] = action.payload;
      })
      .addCase(updateQuiltingOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { markPaidLocally } = adminQuiltingOrderSlice.actions;
export default adminQuiltingOrderSlice.reducer;