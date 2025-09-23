import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch all quilting orders for the logged-in user
export const fetchUserQuiltingOrders = createAsyncThunk(
  "quiltingOrders/fetchUserQuiltingOrders",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/quilting-orders/my-quilts`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data; // array of quilting orders
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Fetch a single quilting order by ID
export const fetchQuiltingOrderById = createAsyncThunk(
  "quiltingOrders/fetchQuiltingOrderById",
  async (id, thunkAPI) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/quilting-orders/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data; // single quilting order
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const quiltingOrderSlice = createSlice({
  name: "quiltingOrders",
  initialState: {
    quiltingOrders: [],
    quiltingOrder: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchUserQuiltingOrders
      .addCase(fetchUserQuiltingOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserQuiltingOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.quiltingOrders = action.payload;
      })
      .addCase(fetchUserQuiltingOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchQuiltingOrderById
      .addCase(fetchQuiltingOrderById.pending, (state) => {
        state.loading = true;
        state.quiltingOrder = null;
      })
      .addCase(fetchQuiltingOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.quiltingOrder = action.payload;
      })
      .addCase(fetchQuiltingOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default quiltingOrderSlice.reducer;