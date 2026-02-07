import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

// Fetch admin message count (new only)
export const fetchNewMessageCount = createAsyncThunk(
  "messages/fetchNewMessageCount",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get(`${API}/api/contact/counts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; // { newCount }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch messages list (admin)
export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async ({ status = "new", search = "" } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get(
        `${API}/api/contact?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data; // array
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update message status
export const updateMessageStatus = createAsyncThunk(
  "messages/updateMessageStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.put(
        `${API}/api/contact/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data; // updated message
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const messagesSlice = createSlice({
  name: "messages",
  initialState: {
    newCount: 0,
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // count
      .addCase(fetchNewMessageCount.fulfilled, (state, action) => {
        state.newCount = Number(action.payload?.newCount || 0);
      })

      // list
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // status update
      .addCase(updateMessageStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        state.items = state.items.map((m) => (m._id === updated._id ? updated : m));
      });
  },
});

export default messagesSlice.reducer;
