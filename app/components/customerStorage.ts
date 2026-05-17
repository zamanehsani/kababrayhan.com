import { type Customer } from "../redux/api";

export const CUSTOMER_STORAGE_KEY = "erpnext.customer";
export const CUSTOMER_PROFILE_STORAGE_KEY = "erpnext.customerProfile";

export interface StoredCustomerProfile {
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  area: string;
  avatar: string | null;
}

const hasWindow = () => "window" in globalThis;

export const readStoredCustomer = (): Customer | null => {
  if (!hasWindow()) {
    return null;
  }

  const storedValue = globalThis.localStorage.getItem(CUSTOMER_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as Customer;
  } catch {
    globalThis.localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    return null;
  }
};

export const saveStoredCustomer = (customer: Customer) => {
  if (!hasWindow()) {
    return;
  }

  globalThis.localStorage.setItem(
    CUSTOMER_STORAGE_KEY,
    JSON.stringify(customer)
  );
};

export const readStoredCustomerProfile = (): StoredCustomerProfile | null => {
  if (!hasWindow()) {
    return null;
  }

  const storedValue = globalThis.localStorage.getItem(
    CUSTOMER_PROFILE_STORAGE_KEY
  );
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as StoredCustomerProfile;
  } catch {
    globalThis.localStorage.removeItem(CUSTOMER_PROFILE_STORAGE_KEY);
    return null;
  }
};

export const saveStoredCustomerProfile = (profile: StoredCustomerProfile) => {
  if (!hasWindow()) {
    return;
  }

  globalThis.localStorage.setItem(
    CUSTOMER_PROFILE_STORAGE_KEY,
    JSON.stringify(profile)
  );
};
