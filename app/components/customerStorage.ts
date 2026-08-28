import type { CustomerDetails } from "../redux/apiType";

export const CUSTOMER_STORAGE_KEY = "erpnext.customer";

const hasWindow = () => "window" in globalThis;

export const readStoredCustomer = (): CustomerDetails | null => {
  if (!hasWindow()) {
    return null;
  }

  const storedValue = globalThis.localStorage.getItem(CUSTOMER_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as CustomerDetails;
  } catch {
    globalThis.localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    return null;
  }
};

export const saveStoredCustomer = (customer: CustomerDetails) => {
  if (!hasWindow()) {
    return;
  }

  globalThis.localStorage.setItem(
    CUSTOMER_STORAGE_KEY,
    JSON.stringify(customer)
  );
};
