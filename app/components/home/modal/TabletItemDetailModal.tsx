import { ChevronLeft, X, Clock, Flame, Minus, Plus, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Dish } from "@/app/types/type";
import { addDishToCart } from "@/app/lib/cart";
import { TabletCustomizationSheet } from "./tablet/TabletCustomizationSheet";
import { useItemCustomizationState } from "./shared/useItemCustomizationState";
import DirhamIcon from "../../icon/DirhamIcon";

export function TabletItemDetailModal({
  dish,
  onClose,
}: Readonly<{
  dish: Dish;
  onClose: () => void;
}>) {
  const [quantity, setQuantity] = useState(1);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(
    Boolean(dish.hasVariants)
  );
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

  const unitPrice = basePrice + selectedAddOnPrice;
  const totalPrice = unitPrice * quantity;

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
    <div className="fixed inset-0 z-250 flex items-center justify-center p-8">
      {/* Backdrop overlay */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Modal Container */}
      <dialog
        className="relative z-10 flex h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-0 shadow-2xl"
        open
        aria-labelledby="tablet-item-detail-title"
      >
        <h2 id="tablet-item-detail-title" className="sr-only">
          {dish.name} details
        </h2>

        {/* Header Actions Container */}
        <div className="absolute top-4 right-4 z-20 flex items-center justify-end pointer-events-none">
          <button
            onClick={onClose}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-100/10 bg-white/80 text-slate-800 backdrop-blur-md shadow-sm transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isCustomizationOpen ? (
            <div className="h-full pt-14">
              <TabletCustomizationSheet
                variationGroups={variationGroups}
                addOnGroups={addOnGroups}
                selections={resolvedSelections}
                onSingleSelect={handleSingleSelect}
                onMultiToggle={handleMultiToggle}
                onBack={() => setIsCustomizationOpen(false)}
              />
            </div>
          ) : (
            <>
              {/* Hero image canvas */}
              <div className="relative flex aspect-16/10 w-full items-center justify-center border-b border-slate-50 bg-slate-50/50 p-6 pt-14">
                <div className="pointer-events-none absolute inset-0 scale-120 opacity-20 blur-3xl">
                  <Image src={dish.img} alt="" fill className="object-cover" />
                </div>
                <div className="relative h-full w-full">
                  <Image
                    src={dish.img}
                    alt={dish.name}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Detail Context Layer */}
              <div className="flex flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-orange-500">
                      {dish.restaurant}
                    </span>
                    <h1 className="mt-0.5 text-2xl font-medium tracking-wide text-slate-800">
                      {dish.name}
                    </h1>
                  </div>
                  <span className="flex items-center shrink-0 text-2xl font-medium tracking-wide text-emerald-600">
                    <DirhamIcon size={18} className="mr-0.5 text-emerald-600" />
                    {unitPrice.toFixed(2)}
                  </span>
                </div>

                {/* Quick Metrics Badge Row */}
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100/80 bg-slate-50 px-4 py-2.5 text-xs font-medium tracking-wide text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Flame size={14} className="text-orange-500" />
                    <span>{dish.cal} kcal</span>
                  </div>
                  <div className="h-3 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    <span>Ready in {dish.time}</span>
                  </div>
                  <div className="h-3 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span>{dish.rating} stars</span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-medium tracking-wide text-slate-800">
                    About this item
                  </h3>
                  <div
                    className="prose prose-sm max-w-none font-sans leading-relaxed tracking-wide text-slate-400 prose-p:my-1 prose-p:text-slate-400 prose-strong:font-normal prose-strong:text-slate-700 prose-ul:list-disc prose-ul:pl-4 prose-li:my-0.5"
                    dangerouslySetInnerHTML={{ __html: dish.description }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {hasCustomizationOptions && (
          <div className="flex items-center justify-between border-t border-slate-100/80 bg-white px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-wide text-slate-800">
                Modification
              </span>
              {selectedCount > 0 && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-yellow-700">
                  {selectedCount} chosen
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsCustomizationOpen((current) => !current)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium tracking-wide text-slate-700 transition-colors hover:bg-white"
              aria-expanded={isCustomizationOpen}
              aria-label={
                isCustomizationOpen
                  ? "Back to item details"
                  : "Open modification options"
              }
            >
              {isCustomizationOpen ? (
                <>
                  <ChevronLeft size={13} className="shrink-0" />
                  <span>Back to item</span>
                </>
              ) : (
                <>
                  <span>Modify options</span>
                  <span className="text-[10px]">▼</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer control bracket */}
        <div className="mt-auto flex items-center gap-4 border-t border-slate-50 bg-white p-6">
          <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm active:scale-90 transition-all"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-sm font-medium tracking-wide text-slate-800">
              {quantity.toString().padStart(2, "0")}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-slate-800 shadow-sm active:scale-90 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`h-12 flex-1 rounded-full text-sm font-medium tracking-wide shadow-md transition-all ${
              canAddToCart
                ? "bg-yellow-400 text-slate-800 shadow-yellow-200/40 active:scale-[0.98]"
                : "bg-slate-200 text-slate-500 shadow-slate-100 cursor-not-allowed"
            }`}
          >
            {canAddToCart
              ? `Add to Cart • AED ${totalPrice.toFixed(2)}`
              : variantGateMessage || "Choose required options"}
          </button>
        </div>
      </dialog>
    </div>
  );
}