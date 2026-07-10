import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import myShopsSlice from './myShopsSlice';

export const store = configureStore({
    reducer: {
        ui: uiReducer,
        myShops: myShopsSlice, // Your UI state is now registered globally
    },
});

// Clean type safety exports for your components
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
