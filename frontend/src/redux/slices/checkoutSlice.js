import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to create a checkout session
export const createCheckout = createAsyncThunk(
    "checkout/createCheckout",
    async ( checkoutData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/checkouts`,
                checkoutData,
                token
                    ? {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                      }
                    : undefined
            );
            return response.data;
        } catch (error) {
            console.error("Checkout error:", error);
            return rejectWithValue(error.response.data);
        }
    }
);

const checkoutSlice = createSlice({
    name: "checkout",
    initialState: {
        checkout: null,
        loading: false,
        error: null,
    },
    reducers: {
        // NEW: save the finalized checkout
        setCheckout: (state, action) => {
            state.checkout = action.payload;
        },
        clearCheckout: (state) => {
            state.checkout = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createCheckout.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCheckout.fulfilled, (state, action) => {
                state.loading = false;
                state.checkout = action.payload;
            })
            .addCase(createCheckout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message;
            });
    },
});

export const { setCheckout, clearCheckout } = checkoutSlice.actions;
export default checkoutSlice.reducer;
