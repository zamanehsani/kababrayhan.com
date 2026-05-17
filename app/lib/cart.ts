import type { Dish } from "@/app/types/type";

export type CartItem = {
  id: number | string;
  title: string;
  description?: string;
  image: string;
  discountedPrice: number;
  realPrice: number;
};

export type CartAddon = {
  title: string;
  description?: string;
};

export type CartEntry = {
  item: CartItem;
  addon: CartAddon;
  qty: number;
};

const CART_KEY = "cart";
const CART_UPDATED_EVENT = "cartUpdated";

export const getCart = (): CartEntry[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CART_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as CartEntry[];
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartEntry[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

export const addDishToCart = (dish: Dish, qty = 1) => {
  if (typeof window === "undefined") return;
  const cart = getCart();
  const itemId = String(dish.id);
  const existingIndex = cart.findIndex(
    (entry) => String(entry.item.id) === itemId
  );

  if (existingIndex !== -1) {
    cart[existingIndex].qty = (cart[existingIndex].qty || 1) + qty;
  } else {
    cart.push({
      item: {
        id: dish.id,
        title: dish.name,
        description: dish.description,
        image: dish.img,
        discountedPrice: Number(dish.price),
        realPrice: Number(dish.price),
      },
      addon: {
        title: "Standard portion",
        description: dish.tags,
      },
      qty,
    });
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
