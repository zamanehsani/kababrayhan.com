import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type PhoneStatus = "none" | "entered" | "verified";

export interface SessionState {
  phone: string;
  phoneStatus: PhoneStatus;
  address: string;
  addressId: string;
  user: string | null;
  customer: string | null;
}

const initialState: SessionState = {
  phone: "",
  phoneStatus: "none",
  address: "",
  addressId: "",
  user: null,
  customer: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    hydrateSession: (state, action: PayloadAction<Partial<SessionState>>) => {
      const payload = action.payload;
      state.phone = payload.phone ?? state.phone;
      state.phoneStatus = payload.phoneStatus ?? state.phoneStatus;
      state.address = payload.address ?? state.address;
      state.addressId = payload.addressId ?? state.addressId;
      state.user = payload.user ?? state.user;
      state.customer = payload.customer ?? state.customer;
    },
    setAuthenticatedIdentity: (
      state,
      action: PayloadAction<{ user: string; customer: string | null }>
    ) => {
      state.user = action.payload.user;
      state.customer = action.payload.customer;
    },
    setPhoneEntered: (state, action: PayloadAction<string>) => {
      state.phone = action.payload;
      state.phoneStatus = "entered";
    },
    setPhoneVerified: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload) {
        state.phone = action.payload;
      }
      if (state.phone) {
        state.phoneStatus = "verified";
      }
    },
    setAddress: (
      state,
      action: PayloadAction<{ address: string; addressId?: string }>
    ) => {
      state.address = action.payload.address;
      if (typeof action.payload.addressId === "string") {
        state.addressId = action.payload.addressId;
      }
    },
    clearSession: (state) => {
      state.phone = "";
      state.phoneStatus = "none";
      state.address = "";
      state.addressId = "";
      state.user = null;
      state.customer = null;
    },
  },
});

export const {
  hydrateSession,
  setAuthenticatedIdentity,
  setPhoneEntered,
  setPhoneVerified,
  setAddress,
  clearSession,
} = sessionSlice.actions;

export const sessionReducer = sessionSlice.reducer;
