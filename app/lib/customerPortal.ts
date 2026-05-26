import { getCart } from "@/app/lib/cart";
import {
  clearSession,
  hydrateSession,
  setAddress,
  setPhoneEntered,
  setPhoneVerified,
  type PhoneStatus,
} from "@/app/redux/sessionSlice";
import { store } from "@/app/redux/store";

export const PHONE_KEY = "uae_phone";
export const PHONE_STATUS_KEY = "uae_phone_status";
export const ADDRESS_KEY = "uae_address";
export const ADDRESS_ID_KEY = "uae_address_id";

export const CUSTOMER_PORTAL_UPDATED = "customerPortalUpdated";

export type CustomerPortalSnapshot = {
  phone: string;
  phoneStatus: PhoneStatus;
  isVerified: boolean;
  address: string;
  addressId: string;
  hasOrder: boolean;
};

const hasWindow = () => "window" in globalThis;

const normalizePhoneStatus = (value: string | null): PhoneStatus => {
  if (value === "verified" || value === "entered") {
    return value;
  }

  return "none";
};

const readStorageState = () => {
  if (!hasWindow()) {
    return {
      phone: "",
      phoneStatus: "none" as PhoneStatus,
      address: "",
      addressId: "",
    };
  }

  return {
    phone: globalThis.localStorage.getItem(PHONE_KEY) || "",
    phoneStatus: normalizePhoneStatus(
      globalThis.localStorage.getItem(PHONE_STATUS_KEY)
    ),
    address: globalThis.localStorage.getItem(ADDRESS_KEY) || "",
    addressId: globalThis.localStorage.getItem(ADDRESS_ID_KEY) || "",
  };
};

const writeStorageState = (
  updates: Partial<{ phone: string; phoneStatus: PhoneStatus; address: string; addressId: string }>
) => {
  if (!hasWindow()) return;

  if (typeof updates.phone === "string") {
    if (updates.phone) {
      globalThis.localStorage.setItem(PHONE_KEY, updates.phone);
    } else {
      globalThis.localStorage.removeItem(PHONE_KEY);
    }
  }

  if (typeof updates.phoneStatus === "string") {
    if (updates.phoneStatus === "none") {
      globalThis.localStorage.removeItem(PHONE_STATUS_KEY);
    } else {
      globalThis.localStorage.setItem(PHONE_STATUS_KEY, updates.phoneStatus);
    }
  }

  if (typeof updates.address === "string") {
    if (updates.address) {
      globalThis.localStorage.setItem(ADDRESS_KEY, updates.address);
    } else {
      globalThis.localStorage.removeItem(ADDRESS_KEY);
    }
  }

  if (typeof updates.addressId === "string") {
    if (updates.addressId) {
      globalThis.localStorage.setItem(ADDRESS_ID_KEY, updates.addressId);
    } else {
      globalThis.localStorage.removeItem(ADDRESS_ID_KEY);
    }
  }
};

export const initializeCustomerPortalSession = () => {
  const storageState = readStorageState();
  store.dispatch(
    hydrateSession({
      phone: storageState.phone,
      phoneStatus: storageState.phoneStatus,
      address: storageState.address,
      addressId: storageState.addressId,
    })
  );
};

export const saveEnteredPhone = (phone: string) => {
  // If the phone changed, the old delivery address belongs to a different customer — clear it
  const currentPhone = readStorageState().phone;
  if (currentPhone && currentPhone !== phone) {
    globalThis.localStorage?.removeItem("uae_delivery_address");
    globalThis.localStorage?.removeItem("uae_delivery_address_id");
    globalThis.localStorage?.removeItem("uae_delivery_addresses");
  }
  writeStorageState({ phone, phoneStatus: "entered" });
  store.dispatch(setPhoneEntered(phone));
  dispatchCustomerPortalUpdated();
};

export const saveVerifiedPhone = (phone?: string) => {
  if (typeof phone === "string") {
    writeStorageState({ phone });
  }

  writeStorageState({ phoneStatus: "verified" });
  store.dispatch(setPhoneVerified(phone));
  dispatchCustomerPortalUpdated();
};

export const saveDeliveryAddress = (address: string, addressId?: string) => {
  writeStorageState({ address, addressId });
  // Also write delivery-specific keys so checkout's Delivery To card picks them up
  if (address) globalThis.localStorage?.setItem("uae_delivery_address", address);
  if (addressId) globalThis.localStorage?.setItem("uae_delivery_address_id", addressId);
  store.dispatch(setAddress({ address, addressId }));
  dispatchCustomerPortalUpdated();
};

export const clearCustomerPortalSession = () => {
  writeStorageState({ phone: "", phoneStatus: "none", address: "", addressId: "" });
  globalThis.localStorage?.removeItem("uae_delivery_address");
  globalThis.localStorage?.removeItem("uae_delivery_address_id");
  globalThis.localStorage?.removeItem("uae_delivery_addresses");
  store.dispatch(clearSession());
  dispatchCustomerPortalUpdated();
};

export const getStoredAddressId = () => {
  const sessionAddressId = store.getState().session.addressId;
  if (sessionAddressId) return sessionAddressId;
  return readStorageState().addressId;
};

export const readCustomerPortalSnapshot = (): CustomerPortalSnapshot => {
  const session = store.getState().session;
  const storageState = readStorageState();

  const phone = session.phone || storageState.phone;
  const phoneStatus =
    session.phoneStatus !== "none"
      ? session.phoneStatus
      : storageState.phoneStatus;
  const address = session.address || storageState.address;
  const addressId = session.addressId || storageState.addressId;
  const hasOrder = getCart().length > 0;

  return {
    phone,
    phoneStatus,
    isVerified: phoneStatus === "verified" && Boolean(phone),
    address,
    addressId,
    hasOrder,
  };
};

export const dispatchCustomerPortalUpdated = () => {
  if (!hasWindow()) return;
  globalThis.dispatchEvent(new Event(CUSTOMER_PORTAL_UPDATED));
};
