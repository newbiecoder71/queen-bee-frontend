import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


// Fetch all users (admin only)
export const fetchUsers = createAsyncThunk(
    "admin/fetchUsers",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/users/admin/users`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` },
                }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Add the create user action
export const addUser = createAsyncThunk(
    "admin/addUser",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/users/admin/users`,
                userData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Update user information
export const updateUser = createAsyncThunk(
    'admin/updateUser',
    async ({ id, name, email, role, password, adminNotes, employeeRole, employeePermissions }, { rejectWithValue }) => {
        try {
            const body = { name, email, role };
            if (password && password.trim() !== "") {
                body.password = password;
            }
            if (adminNotes !== undefined) {
                body.adminNotes = adminNotes;
            }
            if (employeeRole !== undefined) {
                body.employeeRole = employeeRole;
            }
            if (employeePermissions !== undefined) {
                body.employeePermissions = employeePermissions;
            }
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/users/admin/users/${id}`,
                body,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('userToken')}`
                    },
                }
            );
            return response.data;  // Very CRITICAL to return response data here instead of response.data.user.  response.data will update information without a refresh.
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Delete a user
export const deleteUser = createAsyncThunk(
    'admin/deleteUser',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/users/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` },
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState: {
        users: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                const updatedUser = action.payload;
                state.users = state.users.map((user) =>
                  user._id === updatedUser._id ? updatedUser : user
                );
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter((user) => user._id !== action.payload);
            })
            .addCase(addUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            }).addCase(addUser.fulfilled, (state, action) => {
                state.loading = false;
                state.users.push(action.payload); // Add a new user to the state
            }).addCase(addUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            });
    },
});

export default adminSlice.reducer;
