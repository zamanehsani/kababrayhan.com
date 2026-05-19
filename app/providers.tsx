"use client";

import { Provider } from "react-redux";
import { useEffect, type ReactNode } from "react";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./redux/store";
import { initializeCustomerPortalSession } from "./lib/customerPortal";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    initializeCustomerPortalSession();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
