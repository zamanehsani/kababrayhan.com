const hasWindow = () => "window" in globalThis;

const removeKeys = (keys: string[]) => {
  if (!hasWindow()) return;
  keys.forEach((key) => globalThis.localStorage.removeItem(key));
};

export const clearPendingCheckout = () => {
  removeKeys(["cart"]);
};

export const clearCheckoutInfo = () => {
  removeKeys([
    "uae_phone",
    "uae_phone_status",
    "uae_address",
    "uae_address_id",
  ]);
};

export const clearPendingSalesOrder = () => {
  removeKeys(["pending_sales_order", "sales_order"]);
};
