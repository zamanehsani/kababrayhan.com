import { X, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Dish } from "@/app/types/type";
import { addDishToCart } from "@/app/lib/cart";
import { useItemCustomizationState } from "../shared/useItemCustomizationState";
import { ModeCustomizationPanel } from "../shared/ModeCustomizationPanel";
import { DesktopItemImagePane } from "./DesktopItemImagePane";
import { DesktopItemHeader } from "./DesktopItemHeader";
import { DesktopItemMetaBadges } from "./DesktopItemMetaBadges";
import { DesktopItemDescription } from "./DesktopItemDescription";
import { DesktopItemPriceBar } from "./DesktopItemPriceBar";

export function DesktopItemDetailModal({
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

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <DesktopItemMetaBadges
              cal={dish.cal}
              time={dish.time}
              rating={dish.rating}
            />
            <DesktopItemDescription html={dish.description} />

            {/* Inline Customization Options */}
            {hasCustomizationOptions && (
              <div className="mt-6 space-y-5">
                {variationGroups.length > 0 && (
                  <section className="rounded-2xl border border-orange-100 bg-orange-50/40 p-5">
                    <h4 className="text-sm font-semibold tracking-wide text-slate-900">
                      Choose your option
                    </h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Select one to continue.
                    </p>
                    <div className="mt-4">
                      <ModeCustomizationPanel
                        className="flex flex-col gap-3"
                        customizations={variationGroups}
                        selections={resolvedSelections}
                        onSingleSelect={handleSingleSelect}
                        onMultiToggle={handleMultiToggle}
                      />
                    </div>
                  </section>
                )}

                {addOnGroups.length > 0 && (
                  <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                    <h4 className="text-sm font-semibold tracking-wide text-slate-900">
                      Add-ons
                    </h4>
                    <p className="mt-1 mb-3 text-xs text-slate-600">
                      Tap to add extras.
                    </p>
                    
                    {/* Compact Add-on Grid */}
                    {addOnGroups.map((group) => (
                      <div key={group.id} className="grid grid-cols-4 gap-2">
                        {group.options.map((option) => {
                          const isSelected = (resolvedSelections[group.id] || []).includes(option.id);
                          
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleMultiToggle(group.id, option.id)}
                              className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                                isSelected
                                  ? "border-yellow-400 ring-2 ring-yellow-400/30 scale-95"
                                  : "border-slate-200 hover:border-emerald-400"
                              }`}
                            >
                              {option.img && (
                                <Image
                                  src={option.img}
                                  alt={option.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                              
                              {/* Selected Overlay */}
                              {isSelected && (
                                <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                                  <div className="h-6 w-6 rounded-full bg-yellow-400 flex items-center justify-center">
                                    <Check size={14} strokeWidth={3} className="text-slate-900" />
                                  </div>
                                </div>
                              )}
                              
                              {/* Price Badge */}
                              {option.price > 0 && (
                                <div className="absolute bottom-1 right-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                  +{option.price.toFixed(0)}
                                </div>
                              )}
                              
                              {/* Name Tooltip on Hover */}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[10px] font-medium text-white truncate">
                                  {option.name}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </section>
                )}
              </div>
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

