// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { erpApi } from './api';

export const store = configureStore({
  reducer: {
    [erpApi.reducerPath]: erpApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(erpApi.middleware),
});

// Infer types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;