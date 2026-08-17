const hasWindow = () => "window" in globalThis;

const removeKeys = (keys: string[]) => {
  if (!hasWindow()) return;
  keys.forEach((key) => globalThis.localStorage.removeItem(key));
};

export const clearPendingCheckout = () => {
  removeKeys([
    "cart",
    "checkout_client_secret",
    "uae_delivery_address",
    "uae_delivery_address_id",
    "uae_delivery_addresses",
    "uae_delivery_zone",
    "uae_delivery_charge",
    "order_type",
  ]);
  if (globalThis.sessionStorage) {
    globalThis.sessionStorage.removeItem("checkout_client_secret");
  }
};

export const clearCheckoutInfo = () => {
  removeKeys([
    "uae_phone",
    "uae_phone_status",
    "uae_address",
    "uae_address_id",
    "uae_delivery_address",
    "uae_delivery_address_id",
    "uae_delivery_addresses",
    "uae_delivery_zone",
    "uae_delivery_charge",
  ]);
};

export const clearPendingSalesOrder = () => {
  removeKeys(["pending_sales_order", "sales_order", "checkout_client_secret"]);
  if (globalThis.sessionStorage) {
    globalThis.sessionStorage.removeItem("checkout_client_secret");
  }
};
