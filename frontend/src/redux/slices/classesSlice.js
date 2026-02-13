import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

// Public: fetch classes
export const fetchClasses = createAsyncThunk(
  "classes/fetchClasses",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/api/classes`);
      return res.data; // should be an array
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Customer: RSVP to a class
export const rsvpToClass = createAsyncThunk(
  "classes/rsvpToClass",
  async (classId, { rejectWithValue, getState }) => {
    try {
      // Pull token from auth slice (your slice stores it at state.auth.token)
      const token = getState()?.auth?.token;

      const res = await axios.post(
        `${API}/api/classes/${classId}/rsvp`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          // withCredentials is not needed for header-based auth,
          // but keeping it doesn't hurt if you later add cookies
          withCredentials: true,
        }
      );

      const data = res.data;
      const updated = data?.class || data?.updatedClass || data?.cls || data;
      return updated;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const cancelRsvpToClass = createAsyncThunk(
  "classes/cancelRsvpToClass",
  async (classId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.post(
        `${API}/api/classes/${classId}/cancel-rsvp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const classesSlice = createSlice({
  name: "classes",
  initialState: {
    classes: [],
    loading: false,
    error: null,

    // RSVP UI state (optional but helpful)
    rsvpLoading: false,
    rsvpError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchClasses
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // rsvpToClass
      .addCase(rsvpToClass.pending, (state) => {
        state.rsvpLoading = true;
        state.rsvpError = null;
      })
      .addCase(rsvpToClass.fulfilled, (state, action) => {
        state.rsvpLoading = false;

        const updated = action.payload;
        if (updated && updated._id) {
          const idx = state.classes.findIndex((c) => c._id === updated._id);
          if (idx !== -1) state.classes[idx] = updated;
        }
      })
      .addCase(rsvpToClass.rejected, (state, action) => {
        state.rsvpLoading = false;
        state.rsvpError = action.payload || action.error.message;
      })

      // cancelRsvpToClass
      .addCase(cancelRsvpToClass.pending, (state) => {
        state.rsvpLoading = true;      // reuse same spinner
        state.rsvpError = null;
      })
      .addCase(cancelRsvpToClass.fulfilled, (state, action) => {
        state.rsvpLoading = false;

        const updated = action.payload;
        if (updated && updated._id) {
          const idx = state.classes.findIndex((c) => c._id === updated._id);
          if (idx !== -1) state.classes[idx] = updated;
        }
      })
      .addCase(cancelRsvpToClass.rejected, (state, action) => {
        state.rsvpLoading = false;
        state.rsvpError = action.payload || action.error.message;
      });
  },
});

export default classesSlice.reducer;
