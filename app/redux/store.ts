// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { erpApi } from "./api";
import { sessionReducer } from "./sessionSlice";

const sessionPersistConfig = {
  key: "session",
  storage,
  whitelist: ["phone", "phoneStatus", "address", "addressId"],
};

const persistedSessionReducer = persistReducer(sessionPersistConfig, sessionReducer);

export const store = configureStore({
  reducer: {
    [erpApi.reducerPath]: erpApi.reducer,
    session: persistedSessionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(erpApi.middleware),
});

export const persistor = persistStore(store);

// Infer types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;