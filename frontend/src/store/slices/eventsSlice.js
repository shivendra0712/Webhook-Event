import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventsAPI } from '../../services/api';

export const fetchEvents = createAsyncThunk(
    'events/fetchEvents',
    async (params, { rejectWithValue }) => {
        try {
            const response = await eventsAPI.getAll(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createEvent = createAsyncThunk(
    'events/createEvent',
    async (data, { rejectWithValue }) => {
        try {
            const response = await eventsAPI.create(
                data.eventType,
                data.payload,
                data.idempotencyKey
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchEventStats = createAsyncThunk(
    'events/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await eventsAPI.getStats();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    events: [],
    total: 0,
    stats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 },
    loading: false,
    error: null,
};

const eventsSlice = createSlice({
    name: 'events',
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(fetchEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEvents.fulfilled, (state, action) => {
                state.loading = false;
                state.events = action.payload.rows || [];
                state.total = action.payload.count || 0;
            })
            .addCase(fetchEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createEvent.fulfilled, (state, action) => {
                state.events.unshift(action.payload.event);
                state.total += 1;
            })
            .addCase(fetchEventStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEventStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchEventStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default eventsSlice.reducer;

