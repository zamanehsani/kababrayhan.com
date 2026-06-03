
import {
  ChevronLeft,
  Clock,
  Check,
  Flame,
  Minus,
  Plus,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Dish } from "@/app/types/type";
import { addDishToCart } from "@/app/lib/cart";
import { useItemCustomizationState } from "../shared/useItemCustomizationState";
import DirhamIcon from "../../../icon/DirhamIcon";

export function ItemDetailModal({
  dish,
  onClose,
}: Readonly<{
  dish: Dish;
  onClose: () => void;
}>) {
  const [quantity, setQuantity] = useState(1);
  const itemCode = useMemo(() => String(dish.id ?? ""), [dish.id]);
  const {
    variationGroups,
    resolvedSelections,
    selectedAddOns,
    selectedAddOnPrice,
    selectedVariantItem,
    isVariantSelectionRequired,
    isVariantDataLoading,
    variantOptionsCount,
    canAddToCart,
    handleSingleSelect,
  } = useItemCustomizationState(itemCode, Boolean(dish.hasVariants));

  const hasVariationOptions = variationGroups.length > 0;

  const basePrice = useMemo(() => {
    const parsed = Number(selectedVariantItem?.standard_rate ?? dish.price);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [dish.price, selectedVariantItem]);

  const unitPrice = useMemo(
    () => basePrice + selectedAddOnPrice,
    [basePrice, selectedAddOnPrice]
  );

  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  const renderVariationGroup = (group: (typeof variationGroups)[number]) => (
    <div key={group.id} className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {group.options.map((option) => {
        const isSelected = (resolvedSelections[group.id] || []).includes(
          option.id
        );

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSingleSelect(group.id, option.id)}
            className={`flex aspect-square flex-col items-center justify-center rounded-xl border px-2 text-center transition-colors ${
              isSelected
                ? "border-red-600 bg-brand-50 text-slate-900"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span className="text-[11px] font-medium leading-tight">
              {option.name}
            </span>
            <span className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold">
              {option.price > 0 && (
                <span className="text-red-600">
                  AED {option.price.toFixed(2)}
                </span>
              )}
              {isSelected && <Check size={14} className="text-red-500" />}
            </span>
          </button>
        );
      })}
    </div>
  );

  const dishForCart = useMemo<Dish>(() => {
    if (!selectedVariantItem) {
      return {
        ...dish,
        price: basePrice.toFixed(2),
      };
    }

    const resolvedId =
      (typeof selectedVariantItem.item_code === "string" &&
      selectedVariantItem.item_code.trim()) ||
      (typeof selectedVariantItem.name === "string" &&
      selectedVariantItem.name.trim()) ||
      String(dish.id);

    return {
      ...dish,
      id: resolvedId,
      name: selectedVariantItem.item_name || dish.name,
      price: basePrice.toFixed(2),
      cal:
        typeof selectedVariantItem.custom_calories === "number"
          ? selectedVariantItem.custom_calories.toString()
          : dish.cal,
      time:
        typeof selectedVariantItem.custom_prep_time === "number"
          ? `${selectedVariantItem.custom_prep_time} min`
          : dish.time,
      description:
        typeof selectedVariantItem.description === "string" &&
        selectedVariantItem.description.trim()
          ? selectedVariantItem.description
          : dish.description,
    };
  }, [basePrice, dish, selectedVariantItem]);

  const variantGateMessage = useMemo(() => {
    if (!isVariantSelectionRequired || canAddToCart) return "";
    if (isVariantDataLoading) return "Loading options...";
    if (variantOptionsCount === 0) return "No options are available for this item.";
    return "Choose an option";
  }, [
    canAddToCart,
    isVariantDataLoading,
    isVariantSelectionRequired,
    variantOptionsCount,
  ]);

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    addDishToCart(
      dishForCart,
      quantity,
      selectedAddOns.map((addOn) => ({
        id: addOn.id,
        name: addOn.name,
        price: addOn.price,
      }))
    );
    onClose();
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    globalThis.addEventListener("keydown", onKeyDown);

    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <dialog
      className="fixed inset-0 z-250 flex h-full w-full max-h-none max-w-none flex-col overflow-y-auto overflow-x-hidden border-0 p-0 no-scrollbar"
      open
      aria-labelledby="dish-details-title"
    >
      {/* Dynamic adaptive background - blurred dish image for gradient effect */}
      <div className="fixed inset-0 scale-110 blur-3xl opacity-70 pointer-events-none -z-20">
        <Image src={dish.img} alt="" fill className="object-cover" />
      </div>

      {/* Gradient overlay for smooth color transition and readability */}
      <div className="absolute inset-0 bg-linear-to-b from-white/90 via-white/85 to-white/90 -z-10" />
      {/* Full-bleed hero image with overlay action bar */}
      <div className="relative w-full aspect-4/3 overflow-hidden">
        {/* Main image */}
        <Image
          src={dish.img}
          alt={dish.name}
          fill
          className="object-contain"
          priority
        />
        {/* Overlaid action bar */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-slate-800 shadow-sm active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <h2
            id="dish-details-title"
            className="hidden md:block text-lg font-semibold text-slate-800 bg-white/70 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm"
          >
            Item details
          </h2>
          <div className="h-10 w-10" />
        </div>
      </div>

      {/* 4. DISH NAME AND PRICE TITLE */}
      <div className="flex items-start justify-between px-5 mb-4">
        <h1 className="text-xl font-medium text-slate-800 tracking-wide max-w-[70%]">
          {dish.name}
        </h1>
        <span className="flex items-center text-xl font-semibold text-red-600">
          <DirhamIcon size={16} className="mr-0.5 text-red-600" />
          {unitPrice.toFixed(2)}
        </span>
      </div>

      {/* 5. QUICK METRICS (Calories, Time, Rating) */}
      <div className="flex items-center justify-between px-5 py-3 border-y border-slate-100 mb-2 text-slate-600 text-xs font-semibold">
        <div className="flex items-center gap-1">
          <Flame size={14} className="text-red-500" />
          <span>{dish.cal} calories</span>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-1">
          <Clock size={14} className="text-slate-400" />
          <span>Ready in {dish.time}</span>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-1">
          <Star size={14} className="text-red-600 fill-red-600" />
          <span>{dish.rating} stars</span>
        </div>
      </div>

      {/* 6. DESCRIPTION SECTION */}
      <div className="px-5 mb-2">
        <div
          className="prose prose-sm font-sans leading-relaxed tracking-wide text-slate-400 max-w-none
          prose-p:text-slate-400 prose-p:my-1
          prose-strong:text-slate-700 prose-strong:font-normal
          prose-ul:list-disc prose-ul:pl-4 prose-li:my-0.5"
          dangerouslySetInnerHTML={{ __html: dish.description }}
        />
      </div>

      {hasVariationOptions && (
        <div className="px-5 pb-2">
          <p className="text-sm font-medium text-slate-800">Select one to continue.</p>
          <div className="mt-3 flex flex-col gap-2">
            {variationGroups.map(renderVariationGroup)}
          </div>
        </div>
      )}

      {/* 8. BOTTOM QUANTITY AND PURCHASE PANEL */}
      <div className="mt-auto  px-4 pt-4 pb-8 flex items-center gap-4 border-t border-slate-50">
        {/* Counter controls */}
        <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm active:scale-90"
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center font-semibold tracking-wide text-sm text-slate-800">
            {quantity.toString().padStart(2, "0")}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-sm active:scale-90"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={`flex-1 h-12 rounded-full font-semibold text-sm tracking-wide shadow-md transition-transform ${
            canAddToCart
              ? "bg-red-600 text-white shadow-red-200/50 active:scale-[0.98]"
              : "bg-slate-200 text-slate-500 shadow-slate-100 cursor-not-allowed"
          }`}
        >
          {canAddToCart
            ? `Add to Cart • AED ${totalPrice.toFixed(2)}`
            : variantGateMessage || "Choose required options"}
        </button>
      </div>
    </dialog>
  );
}
