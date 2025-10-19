import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { webhooksAPI } from '../../services/api';

export const fetchWebhooks = createAsyncThunk(
    'webhooks/fetchWebhooks',
    async (params, { rejectWithValue }) => {
        try {
            const response = await webhooksAPI.getAll(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createWebhook = createAsyncThunk(
    'webhooks/createWebhook',
    async (data, { rejectWithValue }) => {
        try {
            const response = await webhooksAPI.create(
                data.name,
                data.url,
                data.eventTypes,
                data.headers
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateWebhook = createAsyncThunk(
    'webhooks/updateWebhook',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await webhooksAPI.update(id, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteWebhook = createAsyncThunk(
    'webhooks/deleteWebhook',
    async (id, { rejectWithValue }) => {
        try {
            await webhooksAPI.delete(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    webhooks: [],
    total: 0,
    loading: false,
    error: null,
};

const webhooksSlice = createSlice({
    name: 'webhooks',
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(fetchWebhooks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWebhooks.fulfilled, (state, action) => {
                state.loading = false;
                state.webhooks = action.payload.rows || [];
                state.total = action.payload.count || 0;
            })
            .addCase(fetchWebhooks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createWebhook.fulfilled, (state, action) => {
                state.webhooks.unshift(action.payload.webhook);
                state.total += 1;
            })
            .addCase(deleteWebhook.fulfilled, (state, action) => {
                state.webhooks = state.webhooks.filter((w) => w.id !== action.payload);
                state.total -= 1;
            });
    },
});

export default webhooksSlice.reducer;

