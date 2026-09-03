import type { Dish } from "@/app/types/type";

export type CartVariation = {
  id?: string;
  title?: string;
  name?: string;
  optionId?: string;
};

export type CartBaseItem = {
  itemCode?: string;
  id?: string | number;
  name?: string;
  title?: string;
};

export type CartItem = {
  id: number | string;
  baseItemCode?: string;
  baseTitle?: string;
  item_name?: string;
  title: string;
  variationTitle?: string;
  variation?: CartVariation | null;
  baseItem?: CartBaseItem | null;
  description?: string;
  image: string;
  discountedPrice: number;
  realPrice: number;
  prep_time?: number;
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

const buildDisplayTitle = (baseTitle: string, variationTitle?: string) => {
  const normalizedBase = baseTitle.trim();
  const normalizedVariation = variationTitle?.trim();

  if (!normalizedVariation) return normalizedBase;

  return `${normalizedBase} - ${normalizedVariation}`;
};

const buildVariationPayload = (variationTitle?: string): CartVariation | null => {
  const normalized = variationTitle?.trim();

  if (!normalized) return null;

  return {
    id: slugify(normalized),
    title: normalized,
    name: normalized,
    optionId: slugify(normalized),
  };
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
  selectedAddOns: CartSelectedAddOn[] = [],
  baseTitleOverride?: string,
  variationTitle?: string
) => {
  if (globalThis.window === undefined) return;

  const cart = getCart();
  const baseItemCode = String(dish.id);
  const baseTitle = String(baseTitleOverride || dish.name || "").trim();
  const displayTitle = buildDisplayTitle(baseTitle, variationTitle);

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
        baseTitle,
        item_name: baseTitle,
        title: displayTitle,
        variationTitle,
        variation: buildVariationPayload(variationTitle),
        baseItem: {
          itemCode: baseItemCode,
          id: baseItemCode,
          name: baseTitle,
          title: baseTitle,
        },
        description: dish.description,
        image: dish.img,
        discountedPrice: unitPrice,
        realPrice: unitPrice,
        prep_time: Number.isFinite(Number(dish.custom_prep_time))
          ? Number(dish.custom_prep_time)
          : undefined,
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
