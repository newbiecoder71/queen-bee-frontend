import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

export const fetchNewSubscriberCount = createAsyncThunk(
  "newsletter/fetchNewSubscriberCount",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get(`${API}/api/newsletter/counts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; // { newCount }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const newsletterSlice = createSlice({
  name: "newsletter",
  initialState: { newCount: 0 },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchNewSubscriberCount.fulfilled, (state, action) => {
      state.newCount = Number(action.payload?.newCount || 0);
    });
  },
});

export default newsletterSlice.reducer;
