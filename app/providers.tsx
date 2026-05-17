"use client";

import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { store } from "./redux/store";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return <Provider store={store}>{children}</Provider>;
}
