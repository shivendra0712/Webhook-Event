import { configureStore } from '@reduxjs/toolkit'
import eventsReducer from './slices/eventsSlice'
import webhooksReducer from './slices/webhooksSlice'
import deliveriesReducer from './slices/deliveriesSlice'

export const store = configureStore({
  reducer: {
    events: eventsReducer,
    webhooks: webhooksReducer,
    deliveries: deliveriesReducer,
  },
})

