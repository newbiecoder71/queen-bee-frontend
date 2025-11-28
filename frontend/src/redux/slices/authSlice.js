import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/* --------------------------------------------
   SAFE LOAD USER FROM LOCAL STORAGE (No crashes)
--------------------------------------------- */
let userFromStorage = null;

try {
  const raw = localStorage.getItem("userInfo");

  userFromStorage =
    raw && raw !== "undefined" ? JSON.parse(raw) : null;
} catch {
  userFromStorage = null;
}

/* --------------------------------------------
   GUEST ID SETUP
--------------------------------------------- */
const initialGuestId =
  localStorage.getItem("guestId") ||
  `guest_${new Date().getTime()}`;

localStorage.setItem("guestId", initialGuestId);

/* --------------------------------------------
   INITIAL STATE
--------------------------------------------- */
const initialState = {
  user: userFromStorage,
  guestId: initialGuestId,
  token: localStorage.getItem("userToken") || null,
  loading: false,
  error: null,
};

/* --------------------------------------------
   LOGIN THUNK
--------------------------------------------- */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/login`,
        userData
      );

      console.log("LOGIN RESPONSE:", response.data);

      const { user, token } = response.data;

      const normalizedUser = user;

      // Return consistent object
      return { user: normalizedUser, token };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Login failed" }
      );
    }
  }
);

/* --------------------------------------------
   REGISTER THUNK (matches login return shape)
--------------------------------------------- */
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
        userData
      );

      const { user, token } = response.data;
      const normalizedUser = { ...user, userId: user._id };

      // MUST match loginUser's return shape
      return { user: normalizedUser, token };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Registration failed" }
      );
    }
  }
);

/* --------------------------------------------
   AUTH SLICE
--------------------------------------------- */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;

      // Completely clear cart + guestId
      localStorage.removeItem("cart");
      localStorage.removeItem("guestId");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("userId");
      localStorage.removeItem("userToken");

      // Create new guest ID
      state.guestId = `guest_${new Date().getTime()}`;
      localStorage.setItem("guestId", state.guestId);
    },

    generateNewGuestId: (state) => {
      state.guestId = `guest_${new Date().getTime()}`;
      localStorage.setItem("guestId", state.guestId);
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  /* --------------------------------------------
     EXTRA REDUCERS (ASYNC THUNKS)
  --------------------------------------------- */
  extraReducers: (builder) => {
    /* LOGIN */
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;
        state.token = action.payload.token;

        /* Store in localStorage */
        localStorage.setItem(
          "userInfo",
          JSON.stringify(action.payload.user)
        );
        localStorage.setItem("userId", action.payload.user._id);
        localStorage.setItem("userToken", action.payload.token);

        /* Remove guestId (SUPER IMPORTANT) */
        localStorage.removeItem("guestId");
        state.guestId = null;  // <- Without this Redux still thinks you're a guest
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Login failed";
      });

    /* REGISTER */
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;
        state.token = action.payload.token;

        /* Store in localStorage */
        localStorage.setItem(
          "userInfo",
          JSON.stringify(action.payload.user)
        );
        const idToStore = action.payload.user._id;
        localStorage.setItem("userId", idToStore);
        localStorage.setItem("userToken", action.payload.token);

        /* Remove guestId */
        localStorage.removeItem("guestId");
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          "Registration failed";
      });
  },
});

/* --------------------------------------------
   EXPORTS
--------------------------------------------- */
export const {
  logout,
  generateNewGuestId,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
