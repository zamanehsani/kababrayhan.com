import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dish } from "@/app/types/type";
import { addDishToCart } from "@/app/lib/cart";
import { useItemCustomizationState } from "../shared/useItemCustomizationState";
import { DesktopItemImagePane } from "./DesktopItemImagePane";
import { DesktopItemHeader } from "./DesktopItemHeader";
import { DesktopItemMetaBadges } from "./DesktopItemMetaBadges";
import { DesktopItemDescription } from "./DesktopItemDescription";
import { DesktopCustomizationTriggers } from "./DesktopCustomizationTriggers";
import { DesktopCustomizationDrawer } from "./DesktopCustomizationDrawer";
import { DesktopItemPriceBar } from "./DesktopItemPriceBar";
// DesktopCustomizationSheet is preserved at ../desktop/DesktopCustomizationSheet — re-import when reverting drawer design

export function DesktopItemDetailModal({
  dish,
  onClose,
}: Readonly<{
  dish: Dish;
  onClose: () => void;
}>) {
  const [quantity, setQuantity] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const itemCode = useMemo(() => String(dish.id ?? ""), [dish.id]);

  const {
    variationGroups,
    addOnGroups,
    resolvedSelections,
    selectedCount,
    selectedAddOns,
    selectedAddOnPrice,
    selectedVariantItem,
    isVariantSelectionRequired,
    isVariantDataLoading,
    variantOptionsCount,
    canAddToCart,
    handleSingleSelect,
    handleMultiToggle,
  } = useItemCustomizationState(itemCode, Boolean(dish.hasVariants));

  const hasCustomizationOptions =
    variationGroups.length > 0 || addOnGroups.length > 0;

  const basePrice = useMemo(() => {
    const parsed = Number(selectedVariantItem?.standard_rate ?? dish.price);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [dish.price, selectedVariantItem]);

  const totalPrice = ((basePrice + selectedAddOnPrice) * quantity).toFixed(2);

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
    return "Please choose an option before adding to cart.";
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
    <div className="fixed inset-0 z-250 flex items-center justify-center p-8 xl:p-12">
      {/* Backdrop overlay */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Premium Split-Pane Frame */}
      <dialog
        className="relative z-10 grid h-160 w-full max-w-5xl grid-cols-12 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-0 shadow-2xl"
        open
        aria-labelledby="desktop-item-detail-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-800 shadow-md transition-all hover:bg-slate-50 active:scale-95"
        >
          <X size={18} />
        </button>

        <DesktopItemImagePane src={dish.img} alt={dish.name} />

        {/* Right Column */}
        <div className="col-span-7 flex h-full flex-col bg-white">
          <h2 id="desktop-item-detail-title" className="sr-only">
            {dish.name} details
          </h2>

          <DesktopItemHeader restaurant={dish.restaurant} name={dish.name} />

          {/* Relative container: scrollable content + sliding drawer */}
          <div className="relative flex-1 overflow-hidden">
            <div className="absolute inset-0 overflow-y-auto no-scrollbar px-8 py-6">
              <DesktopItemMetaBadges
                cal={dish.cal}
                time={dish.time}
                rating={dish.rating}
              />
              <DesktopItemDescription html={dish.description} />
              {hasCustomizationOptions && (
                <DesktopCustomizationTriggers
                  hasVariations={variationGroups.length > 0}
                  hasAddOns={addOnGroups.length > 0}
                  selectedCount={selectedCount}
                  onOpen={() => setIsDrawerOpen(true)}
                />
              )}
            </div>

            {hasCustomizationOptions && (
              <DesktopCustomizationDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                selectedCount={selectedCount}
                variationGroups={variationGroups}
                addOnGroups={addOnGroups}
                resolvedSelections={resolvedSelections}
                onSingleSelect={handleSingleSelect}
                onMultiToggle={handleMultiToggle}
              />
            )}
          </div>

          <DesktopItemPriceBar
            totalPrice={totalPrice}
            quantity={quantity}
            onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
            onIncrement={() => setQuantity(quantity + 1)}
            canAddToCart={canAddToCart}
            variantGateMessage={variantGateMessage}
            onAddToCart={handleAddToCart}
          />
        </div>
      </dialog>
    </div>
  );
}

