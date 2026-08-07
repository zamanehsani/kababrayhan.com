import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dish } from "@/app/types/type";
import { addDishToCart } from "@/app/lib/cart";
import { useItemCustomizationState } from "../shared/useItemCustomizationState";
import { DesktopItemImagePane } from "./DesktopItemImagePane";
import { DesktopItemHeader } from "./DesktopItemHeader";
import { DesktopItemMetaBadges } from "./DesktopItemMetaBadges";
import { DesktopItemDescription } from "./DesktopItemDescription";
import { DesktopItemPriceBar } from "./DesktopItemPriceBar";
import { AddOnCarousel } from "./AddOnCarousel";


export function DesktopItemDetailModal({
  dish,
  onClose,
}: Readonly<{
  dish: Dish;
  onClose: () => void;
}>) {
  const [quantity, setQuantity] = useState(1);
  const itemCode = useMemo(() => String(dish.id ?? ""), [dish.id]);
  console.log("add ons", itemCode);
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
    return "Select an option";
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
        className={`relative z-10 grid ${hasCustomizationOptions ? 'h-150' : 'h-140'} w-full max-w-5xl grid-cols-12 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-0 shadow-2xl`}
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
          <div className="flex flex-1 min-h-0 flex-col overflow-y-auto px-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <div>
              <DesktopItemMetaBadges
                cal={dish.cal}
                time={dish.time}
                rating={dish.rating}
              />
              <DesktopItemDescription html={dish.description} />
            </div>
          </div>

          {/* Inline Customization Options - compact/no internal spacing to save modal space */}
          {hasCustomizationOptions && (
            <div className="px-4 pt-2 pb-2 bg-white">
              <div className="max-w-full mx-auto flex flex-col gap-0">
                {variationGroups.length > 0 && (
                  <section className="p-0">
                    <p className="m-0 text-sm font-medium text-slate-600">Select one to continue.</p>
                    <div className="mt-1">
                      {variationGroups.map((group) => (
                        <div key={group.id} className="py-0">
                          <AddOnCarousel
                            group={group}
                            selections={resolvedSelections[group.id] || []}
                            onToggle={(optionId: string) => handleSingleSelect(group.id, optionId)}
                            singleSelect
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* {addOnGroups.length > 0 && (
                  <section className="p-0">
                    <h4 className="mb-1 text-xs font-semibold tracking-wide text-slate-900">Add-ons</h4>
                    <div className="space-y-1">
                      {addOnGroups.map((group) => (
                        <div key={group.id} className="py-0">
                          <AddOnCarousel
                            group={group}
                            selections={resolvedSelections[group.id] || []}
                            onToggle={(optionId: string) => handleMultiToggle(group.id, optionId)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )} */}
              </div>
            </div>
          )}

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

