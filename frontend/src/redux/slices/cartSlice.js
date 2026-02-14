import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

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

const resolveCartIdentity = ({ thunkAPI, userId, guestId }) => {
    const state = thunkAPI.getState?.() || {};
    const authUserId = state?.auth?.user?._id;
    const cartUserId = state?.cart?.cart?.user;
    const cartGuestId = state?.cart?.cart?.guestId;

    const resolvedUserId =
      userId || authUserId || cartUserId || localStorage.getItem("userId");

    const resolvedGuestId = resolvedUserId
      ? undefined
      : guestId || cartGuestId || localStorage.getItem("guestId");

    return { resolvedUserId, resolvedGuestId };
};

// Fetch cart for a user or guest
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
    async ({ userId, guestId, productId, quiltingOrderId, classId, itemType = "product", quantity }, thunkAPI) => {
        try {
            const { resolvedUserId, resolvedGuestId } = resolveCartIdentity({
              thunkAPI,
              userId,
              guestId,
            });

            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/carts`, {
                    itemType,
                    productId,
                    quiltingOrderId,
                    classId,
                    quantity,
                    userId: resolvedUserId || undefined,
                    guestId: resolvedGuestId,
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
    async ({ productId, quiltingOrderId, classId, itemType = "product", quantity, userId: passedUserId, guestId: passedGuestId }, thunkAPI) => {
        try {
            const { resolvedUserId, resolvedGuestId } = resolveCartIdentity({
              thunkAPI,
              userId: passedUserId,
              guestId: passedGuestId,
            });

            const { data } = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/carts`, {
                    itemType,
                    productId,
                    quiltingOrderId,
                    classId,
                    quantity,
                    userId: resolvedUserId || undefined,
                    guestId: resolvedGuestId,
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
    async ({ productId, quiltingOrderId, classId, itemType = "product", userId: passedUserId, guestId: passedGuestId }, thunkAPI) => {
      try {
        const { resolvedUserId, resolvedGuestId } = resolveCartIdentity({
          thunkAPI,
          userId: passedUserId,
          guestId: passedGuestId,
        });
  
        const { data } = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/carts`,
          {
            data: {
              itemType,
              productId,
              quiltingOrderId,
              classId,
              userId: resolvedUserId || undefined,
              guestId: resolvedGuestId,
            },
          }
        );
  
        return data;
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.message || "Error removing item from cart"
        );
      }
    }
);

// Merge guest cart with user cart
export const mergeCart = createAsyncThunk(
    "cart/mergeCart",
    async ({ guestId, userId }, { rejectWithValue }) => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/carts/merge`,
          { guestId, userId },  // ✅ just send userId
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }
        );
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response?.data || { message: "Failed to merge cart" });
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
        loadCartFromLocalStorage: (state) => {
            const storedCart = JSON.parse(localStorage.getItem("cart"));
            if (storedCart && Array.isArray(storedCart.products)) {
                state.cart = storedCart;
            } else {
                state.cart = { products: [] };
            }
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
                const mergedCart = action.payload.cart || action.payload;  // ✅ handle both cases
                state.cart = mergedCart;
                saveCartToStorage(mergedCart);
            })              
            .addCase(mergeCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to merge cart";
            });
    },
});

export const { clearCart, loadCartFromLocalStorage } = cartSlice.actions;
export default cartSlice.reducer;
