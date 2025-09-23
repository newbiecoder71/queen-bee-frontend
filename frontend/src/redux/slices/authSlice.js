import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Retrieve user info and token from localStorage
const userFromStorage = localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")) : null;

// Check for an existing guestId in the localStorage or generate a new one
const initialGuestId = localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId", initialGuestId);

// Initial state
const initialState = {
    user: userFromStorage,
    guestId: initialGuestId,
    loading: false,
    error: null,
};

{/* // Async thunk for user login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/login`,
        userData
      );

      localStorage.setItem("userInfo", JSON.stringify(response.data.user));
      localStorage.setItem("userToken", response.data.token);

      return response.data.user;

    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Login failed" });
    }
  }
); 

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
        userData
      );
      localStorage.setItem("userInfo", JSON.stringify(response.data.user));
      localStorage.setItem("userToken", response.data.token);

      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Registration failed" });
    }
  }
); */}

// Async thunk for user login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/login`,
        userData
      );

      const { user, token } = response.data;

      // Normalize: always create userId field
      const normalizedUser = { ...user, userId: user._id };

      localStorage.setItem("userInfo", JSON.stringify(normalizedUser));
      localStorage.setItem("userId", user._id); // explicit for cart
      localStorage.setItem("userToken", token);

      return normalizedUser;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Login failed" });
    }
  }
);

// Async thunk for user registration
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
        userData
      );

      const { user, token } = response.data;

      // Normalize: always create userId field
      const normalizedUser = { ...user, userId: user._id };

      localStorage.setItem("userInfo", JSON.stringify(normalizedUser));
      localStorage.setItem("userId", user._id); // explicit for cart
      localStorage.setItem("userToken", token);

      return normalizedUser;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Registration failed" });
    }
  }
);

// Slice
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.guestId = `guest_${new Date().getTime()}`; // Reset guestId on logout
            localStorage.removeItem("userInfo");
            localStorage.removeItem("userToken");
            localStorage.setItem("guestId", state.guestId); // Set new guestId in localStorage
        },
        generateNewGuestId: (state) => {
            state.guestId = `guest_${new Date().getTime()}`;
            localStorage.setItem("guestId", state.guestId);
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
      builder
        .addCase(loginUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
          state.loading = false;
          state.user = action.payload;
        })
        .addCase(loginUser.rejected, (state, action) => {
          state.loading = false;
          if (action.payload?.field) {
            state.error = {
              field: action.payload.field,
              message: action.payload.message,
            };
          } else {
            state.error = {
              field: "general",
              message: action.payload || "Login failed",
            };
          }
        })
    
        // ✅ FIX: handle successful register
        .addCase(registerUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(registerUser.fulfilled, (state, action) => {
          state.loading = false;
          state.user = action.payload; // update user so useEffect in Register.jsx redirects
        })
        .addCase(registerUser.rejected, (state, action) => {
          state.loading = false;
          if (action.payload?.field) {
            state.error = {
              field: action.payload.field,
              message: action.payload.message,
            };
          } else {
            state.error = {
              field: "general",
              message: action.payload?.message || "Registration failed",
            };
          }
        });
    },    
});

export const { logout, generateNewGuestId, clearError } = authSlice.actions;
export default authSlice.reducer;
