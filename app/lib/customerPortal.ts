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
export const DELIVERY_ADDRESSES_KEY = "uae_delivery_addresses";
// The original ERPNext Customer document name (= first verified phone).
// This never changes even when the user updates their phone number.
export const CUSTOMER_NAME_KEY = "uae_customer_name";

/**
 * Returns the stable ERPNext Customer document name.
 * Falls back to the current stored phone when the key hasn't been set yet
 * (i.e. sessions created before this feature was introduced).
 */
export const getCustomerName = (): string => {
  if (!hasWindow()) return "";
  return (
    globalThis.localStorage.getItem(CUSTOMER_NAME_KEY) ||
    globalThis.localStorage.getItem(PHONE_KEY) ||
    ""
  );
};

export type CustomerPortalSnapshot = {
  phone: string;
  phoneStatus: PhoneStatus;
  isVerified: boolean;
  address: string;
  addressId: string;
  deliveryAddresses: DeliveryAddressItem[];
  hasOrder: boolean;
};

export type DeliveryAddressItem = {
  id?: string;
  title: string;
  address: string;
  addressId: string;
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

  // Validate session in background (non-blocking)
  if (storageState.phoneStatus === "verified" && storageState.phone) {
    validateCustomerSession().catch((err) => 
      console.warn("Session validation failed:", err)
    );
  }
};

/**
 * Validates that the stored customer still exists in ERPNext backend.
 * Clears session if customer was deleted or is invalid.
 */
export const validateCustomerSession = async (): Promise<boolean> => {
  if (!hasWindow()) return false;

  const customerName = getCustomerName();
  if (!customerName) return false;

  try {
    // Check if customer exists by attempting to fetch their data
    const ERP_API_BASE_URL = process.env.NEXT_PUBLIC_ERP_API_BASE_URL || "https://portal.kababrayhan.com";
    const ERP_API_TOKEN = process.env.NEXT_PUBLIC_ERP_API_TOKEN || "";
    
    const response = await fetch(
      `${ERP_API_BASE_URL}/api/resource/Customer/${encodeURIComponent(customerName)}`,
      {
        headers: {
          "Authorization": `token ${ERP_API_TOKEN}`,
          "X-Frappe-Site-Name": "kababrayhan.com",
        },
      }
    );

    if (response.ok) {
      // Customer exists, session is valid
      return true;
    } else if (response.status === 404) {
      // Customer was deleted, clear session
      console.warn("Customer not found in backend, clearing session");
      clearCustomerPortalSession();
      return false;
    } else {
      // Other error, don't clear session (might be temporary network issue)
      console.warn("Unable to validate session, status:", response.status);
      return false;
    }
  } catch (error) {
    // Network error, don't clear session
    console.warn("Session validation network error:", error);
    return false;
  }
};

export const saveEnteredPhone = (phone: string) => {
  const currentPhone = readStorageState().phone;
  // Only clear saved addresses when the phone changes AND no established customer
  // exists yet. When an existing customer updates their phone number we keep
  // their addresses because they are still linked to the same ERPNext Customer.
  const hasEstablishedCustomer = hasWindow()
    ? Boolean(globalThis.localStorage?.getItem(CUSTOMER_NAME_KEY))
    : false;
  if (currentPhone && currentPhone !== phone && !hasEstablishedCustomer) {
    globalThis.localStorage?.removeItem("uae_delivery_address");
    globalThis.localStorage?.removeItem("uae_delivery_address_id");
    globalThis.localStorage?.removeItem(DELIVERY_ADDRESSES_KEY);
  }
  writeStorageState({ phone, phoneStatus: "entered" });
  store.dispatch(setPhoneEntered(phone));
  dispatchCustomerPortalUpdated();
};

export const saveVerifiedPhone = (phone?: string) => {
  if (typeof phone === "string") {
    writeStorageState({ phone });
    // On first-time verification, pin this phone as the permanent ERPNext
    // Customer document name so future phone changes don't lose the link.
    if (hasWindow() && !globalThis.localStorage?.getItem(CUSTOMER_NAME_KEY)) {
      globalThis.localStorage?.setItem(CUSTOMER_NAME_KEY, phone);
    }
  }

  writeStorageState({ phoneStatus: "verified" });
  store.dispatch(setPhoneVerified(phone));
  dispatchCustomerPortalUpdated();
};

export const saveCustomerName = (customerName: string) => {
  if (!hasWindow()) return;

  if (customerName) {
    globalThis.localStorage?.setItem(CUSTOMER_NAME_KEY, customerName);
  } else {
    globalThis.localStorage?.removeItem(CUSTOMER_NAME_KEY);
  }

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
  globalThis.localStorage?.removeItem(DELIVERY_ADDRESSES_KEY);
  globalThis.localStorage?.removeItem(CUSTOMER_NAME_KEY);
  // Clear ERPNext customer cache to prevent stale customer data on re-login
  globalThis.localStorage?.removeItem("erpnext.customer");
  globalThis.localStorage?.removeItem("erpnext.customerProfile");
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
  const deliveryAddresses = readDeliveryAddresses();
  const hasOrder = getCart().length > 0;

  return {
    phone,
    phoneStatus,
    isVerified: phoneStatus === "verified" && Boolean(phone),
    address,
    addressId,
    deliveryAddresses,
    hasOrder,
  };
};

export const dispatchCustomerPortalUpdated = () => {
  if (!hasWindow()) return;
  globalThis.dispatchEvent(new Event(CUSTOMER_PORTAL_UPDATED));
};

const readDeliveryAddresses = (): DeliveryAddressItem[] => {
  if (!hasWindow()) return [];

  const raw = globalThis.localStorage.getItem(DELIVERY_ADDRESSES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeDeliveryAddresses = (addresses: DeliveryAddressItem[]) => {
  if (!hasWindow()) return;
  globalThis.localStorage.setItem(
    DELIVERY_ADDRESSES_KEY,
    JSON.stringify(addresses)
  );
  dispatchCustomerPortalUpdated();
};



export const addDeliveryAddress = (
  item: DeliveryAddressItem
) => {
  const existing = readDeliveryAddresses();

  const exists = existing.some(
    (addr) => addr.addressId === item.addressId
  );

  const updatedAddresses = exists
    ? existing
    : [...existing, item];

  // persist addresses array
  writeDeliveryAddresses(updatedAddresses);

  // persist currently selected address
  saveDeliveryAddress(item.address, item.addressId);

  return updatedAddresses;
};