import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { deliveriesAPI } from '../../services/api';

export const fetchDeliveries = createAsyncThunk(
    'deliveries/fetchDeliveries',
    async (params, { rejectWithValue }) => {
        try {
            const response = await deliveriesAPI.getAll(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const retryDelivery = createAsyncThunk(
    'deliveries/retryDelivery',
    async (id, { rejectWithValue }) => {
        try {
            const response = await deliveriesAPI.retry(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchDeliveryStats = createAsyncThunk(
    'deliveries/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await deliveriesAPI.getStats();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    deliveries: [],
    total: 0,
    stats: { total: 0, pending: 0, delivered: 0, failed: 0, retrying: 0 },
    loading: false,
    error: null,
};

const deliveriesSlice = createSlice({
    name: 'deliveries',
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(fetchDeliveries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDeliveries.fulfilled, (state, action) => {
                state.loading = false;
                state.deliveries = action.payload.rows || [];
                state.total = action.payload.count || 0;
            })
            .addCase(fetchDeliveries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(retryDelivery.fulfilled, (state, action) => {
                const index = state.deliveries.findIndex((d) => d.id === action.payload.delivery.id);
                if (index !== -1) {
                    state.deliveries[index] = action.payload.delivery;
                }
            })
            .addCase(fetchDeliveryStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDeliveryStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchDeliveryStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default deliveriesSlice.reducer;

