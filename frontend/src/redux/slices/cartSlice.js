import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper function to load cart from localStorage
/*const loadCartFromStorage = () => {
    const storedCart = localStorage.getItem("cart");
    return storedCart ? JSON.parse(storedCart) : { products: [] };
};*/

const loadCartFromStorage = () => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart"));
      if (storedCart && Array.isArray(storedCart.products)) {
        return storedCart;
      }
      return { products: [] };
    } catch {
      return { products: [] };
    }
};
  

// Helper function to save cart to localStorage
const saveCartToStorage = (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
};

// Fethc cart for a user or guest
export const fetchCart = createAsyncThunk(
    "cart/fetchCart",
    async ({ userId, guestId }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/carts`,
                {
                    params: { userId, guestId },
                }
            );
            return response.data;
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response.data);
        }
    }
);

// Add item to cart
export const addToCart = createAsyncThunk(
    "cart/addToCart",
    async ({ userId, guestId, productId, quantity }, thunkAPI) => {
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/carts`, {
                    productId,
                    quantity,
                    userId,
                    guestId,                   
                }
            );
            if (data.guestId) {
                localStorage.setItem("guestId", data.guestId);
            }
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

// Update item quantity in cart
export const updateCartItemQuantity = createAsyncThunk(
    "cart/updateCartItemQuantity",
    async ({ productId, quantity }, thunkAPI) => {
        try {
            const userId = localStorage.getItem("userId");
            const guestId = localStorage.getItem("guestId");

            const { data } = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/carts`, {
                    productId,
                    quantity,
                    userId: userId || undefined,
                    guestId: userId ? undefined : guestId,
                }
            );
            return data;
        } catch (error) {
          return thunkAPI.rejectWithValue(error.response?.data?.message || "Error updating cart");
        }
    }
);

// Remove item from cart
export const removeFromCart = createAsyncThunk(
    "cart/removeFromCart",
    async ({ productId }, thunkAPI) => {
        try {
            const userId = localStorage.getItem("userId");
            const guestId = localStorage.getItem("guestId");

            const { data } = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/carts`, {
                data: {
                        productId,
                        userId: userId || undefined,
                        guestId: userId ? undefined : guestId,
                },
            });
            return data;
        } catch (error) {
          return thunkAPI.rejectWithValue(error.response?.data?.message || "Error removing item from cart");
        }
    }
);

// Merge guest cart with user cart
export const mergeCart = createAsyncThunk(
    "cart/mergeCart",
    async ({ guestId, user }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/carts/merge`,
                 { guestId, user },
                 {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                    },
                 }
            );
            return response.data;
        } catch (error) {
          return rejectWithValue(error.response.data);
        }
    }
);

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        cart: loadCartFromStorage(),
        loading: false,
        error: null,
    },
    reducers: {
        clearCart: (state) => {
            state.cart = { products: [] };
            localStorage.removeItem("cart");
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.cart = action.payload;
                saveCartToStorage(action.payload);
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch cart";
            })
            .addCase(addToCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                state.loading = false;
                state.cart = action.payload;
                saveCartToStorage(action.payload);
            })
            .addCase(addToCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to add to cart";
            })
            .addCase(updateCartItemQuantity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
                state.loading = false;
                state.cart = action.payload;
                saveCartToStorage(action.payload);
            })
            .addCase(updateCartItemQuantity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to update item quantity";
            })
            .addCase(removeFromCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeFromCart.fulfilled, (state, action) => {
                state.loading = false;
                state.cart = action.payload;
                saveCartToStorage(action.payload);
            })
            .addCase(removeFromCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to remove item from cart";
            })
            .addCase(mergeCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(mergeCart.fulfilled, (state, action) => {
                state.loading = false;
                state.cart = action.payload;
                saveCartToStorage(action.payload);
            })
            .addCase(mergeCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to merge cart";
            });
    },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;