import type { Dish } from "@/app/types/type";

export type CartItem = {
  id: number | string;
  baseItemCode?: string;
  title: string;
  description?: string;
  image: string;
  discountedPrice: number;
  realPrice: number;
};

export type CartSelectedAddOn = {
  id: string;
  name: string;
  price: number;
};

export type CartAddon = {
  title: string;
  description?: string;
  selectedAddOns?: CartSelectedAddOn[];
};

export type CartEntry = {
  item: CartItem;
  addon: CartAddon;
  qty: number;
};

const CART_KEY = "cart";
const CART_UPDATED_EVENT = "cartUpdated";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

const buildCartLineId = (
  baseItemCode: string,
  selectedAddOns: CartSelectedAddOn[]
) => {
  if (selectedAddOns.length === 0) return baseItemCode;

  const addOnKey = selectedAddOns
    .map((addOn) => slugify(addOn.name))
    .join("-");

  return `${baseItemCode}_${addOnKey}`;
};

export const getCart = (): CartEntry[] => {
  if (globalThis.window === undefined) return [];
  const stored = localStorage.getItem(CART_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as CartEntry[];
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartEntry[]) => {
  if (globalThis.window === undefined) return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  globalThis.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

export const addDishToCart = (
  dish: Dish,
  qty = 1,
  selectedAddOns: CartSelectedAddOn[] = []
) => {
  if (globalThis.window === undefined) return;

  const cart = getCart();
  const baseItemCode = String(dish.id);

  const normalizedAddOns = selectedAddOns
    .map((addOn) => ({
      id: String(addOn.id ?? "").trim(),
      name: String(addOn.name ?? "").trim(),
      price: Number.isFinite(Number(addOn.price)) ? Number(addOn.price) : 0,
    }))
    .filter((addOn) => addOn.id && addOn.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  const lineItemId = buildCartLineId(baseItemCode, normalizedAddOns);
  const selectedAddOnsPrice = normalizedAddOns.reduce(
    (sum, addOn) => sum + addOn.price,
    0
  );
  const basePrice = Number.isFinite(Number(dish.price))
    ? Number(dish.price)
    : 0;
  const unitPrice = basePrice + selectedAddOnsPrice;

  const addOnTitle =
    normalizedAddOns.length > 0
      ? normalizedAddOns.map((addOn) => addOn.name).join(", ")
      : "Standard portion";

  const addOnDescription =
    normalizedAddOns.length > 0
      ? `+AED ${selectedAddOnsPrice.toFixed(2)} add-ons`
      : dish.tags;

  const existingIndex = cart.findIndex(
    (entry) => String(entry.item.id) === lineItemId
  );

  if (existingIndex === -1) {
    cart.push({
      item: {
        id: lineItemId,
        baseItemCode,
        title: dish.name,
        description: dish.description,
        image: dish.img,
        discountedPrice: unitPrice,
        realPrice: unitPrice,
      },
      addon: {
        title: addOnTitle,
        description: addOnDescription,
        selectedAddOns: normalizedAddOns,
      },
      qty,
    });
  } else {
    cart[existingIndex].qty = (cart[existingIndex].qty || 1) + qty;
  }

  saveCart(cart);
};

export const removeCartItem = (index: number) => {
  const cart = getCart();
  const updated = cart.filter((_, idx) => idx !== index);
  saveCart(updated);
  return updated;
};

export const updateCartQty = (index: number, qty: number) => {
  const cart = getCart();
  const updated = [...cart];
  if (!updated[index]) return cart;
  updated[index].qty = qty;
  saveCart(updated);
  return updated;
};

export const CART_UPDATED = CART_UPDATED_EVENT;
