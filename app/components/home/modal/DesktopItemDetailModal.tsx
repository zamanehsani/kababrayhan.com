import { X, Clock, Flame, Heart, Minus, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Dish } from "@/app/types/type";
import { addDishToCart } from "@/app/lib/cart";
import { DesktopCustomizationSheet } from "./desktop/DesktopCustomizationSheet";
import { useItemCustomizationState } from "./shared/useItemCustomizationState";


export function DesktopItemDetailModal({
  dish,
  onClose,
}: Readonly<{
  dish: Dish;
  onClose: () => void;
}>) {
  const [quantity, setQuantity] = useState(1);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const {
    variationGroups,
    addOnGroups,
    resolvedSelections,
    selectedCount,
    handleSingleSelect,
    handleMultiToggle,
  } = useItemCustomizationState(dish.id);

  const totalPrice = (Number(dish.price || 0) * quantity).toFixed(2);

  const handleAddToCart = () => {
    addDishToCart(dish, quantity);
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
        {/* Close Button Anchor */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-md border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <X size={18} />
        </button>

        {isCustomizationOpen ? (
          <div className="col-span-12 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white">
            <h2 id="desktop-item-detail-title" className="sr-only">
              {dish.name} details
            </h2>

            <div className="border-b border-slate-100 px-8 pb-5 pl-24 pt-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-orange-500">
                    {dish.restaurant}
                  </span>
                  <h1 className="mt-1 text-3xl font-medium tracking-wide text-slate-900">
                    {dish.name}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCount > 0 && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-yellow-700">
                      {selectedCount} selected
                    </span>
                  )}
                  <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-white text-red-500 shadow-sm transition-transform hover:scale-105 active:scale-95">
                    <Heart
                      size={18}
                      fill={dish.liked ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>
            </div>

            <DesktopCustomizationSheet
              variationGroups={variationGroups}
              addOnGroups={addOnGroups}
              selections={resolvedSelections}
              onSingleSelect={handleSingleSelect}
              onMultiToggle={handleMultiToggle}
              onBack={() => setIsCustomizationOpen(false)}
            />

            {/* Price View Layout */}
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-white px-8 py-5">
              <div className="flex flex-col">
                <span className="text-xs font-normal tracking-wide text-slate-400">
                  Total Price
                </span>
                <span className="text-3xl font-medium tracking-wide text-emerald-600">
                  AED {totalPrice}
                </span>
              </div>

              {/* Quantity and Checkout Control Set */}
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-full border border-slate-100 bg-slate-50 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-90"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center text-sm font-medium tracking-wide text-slate-800">
                    {quantity.toString().padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-slate-800 shadow-sm transition-all hover:bg-yellow-500 active:scale-90"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="h-12 rounded-full bg-yellow-400 px-8 text-sm font-medium tracking-wide text-slate-800 shadow-md shadow-yellow-200/40 transition-all hover:bg-yellow-500 active:scale-[0.98]"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* LEFT COLUMN: Visual Asset Frame */}
            <div className="col-span-5 relative flex items-center justify-center border-r border-slate-100/80 bg-slate-50/60 p-8">
              <div className="pointer-events-none absolute inset-0 scale-120 opacity-20 blur-3xl">
                <Image src={dish.img} alt="" fill className="object-cover" />
              </div>
              <div className="relative h-full w-full transition-transform duration-500 hover:scale-105">
                <Image
                  src={dish.img}
                  alt={dish.name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Control Workspace */}
            <div className="col-span-7 flex h-full flex-col bg-white">
              <h2 id="desktop-item-detail-title" className="sr-only">
                {dish.name} details
              </h2>

              {/* Header Data Group */}
              <div className="border-b border-slate-100 px-8 pb-5 pt-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-orange-500">
                      {dish.restaurant}
                    </span>
                    <h1 className="mt-1 text-3xl font-medium tracking-wide text-slate-900">
                      {dish.name}
                    </h1>
                  </div>

                  <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-white text-red-500 shadow-sm transition-transform hover:scale-105 active:scale-95">
                    <Heart
                      size={18}
                      fill={dish.liked ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6">
                {/* Metric Badges Stack */}
                <div className="mb-6 flex w-fit items-center gap-5 rounded-2xl border border-slate-100/60 bg-slate-50 px-5 py-3 text-sm font-medium tracking-wide text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Flame size={15} className="text-orange-500" />
                    <span>{dish.cal} kcal</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={15} className="text-slate-400" />
                    <span>{dish.time}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-1.5">
                    <Star size={15} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-slate-800">{dish.rating} Rating</span>
                  </div>
                </div>

                {/* Description Block */}
                <div>
                  <h3 className="mb-1.5 text-sm font-medium tracking-wide text-slate-800">
                    Description
                  </h3>
                  <div
                    className="prose prose-sm max-w-none font-sans leading-relaxed tracking-wide text-slate-400 prose-p:my-1 prose-p:text-slate-400 prose-strong:font-normal prose-strong:text-slate-700 prose-ul:list-disc prose-ul:pl-4 prose-li:my-0.5"
                    dangerouslySetInnerHTML={{ __html: dish.description }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100/80 bg-white px-8 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tracking-wide text-slate-800">
                    Modification
                  </span>
                  {selectedCount > 0 && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-yellow-700">
                      {selectedCount} selected
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomizationOpen((current) => !current)}
                  className="flex items-center gap-0.5 text-xs font-medium tracking-wide text-yellow-600"
                  aria-expanded={isCustomizationOpen}
                >
                  <span>More Details</span>
                  <span className="text-[10px]">▼</span>
                </button>
              </div>

              {/* Price View Layout */}
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-white px-8 py-5">
                <div className="flex flex-col">
                  <span className="text-xs font-normal tracking-wide text-slate-400">
                    Total Price
                  </span>
                  <span className="text-3xl font-medium tracking-wide text-emerald-600">
                    AED {totalPrice}
                  </span>
                </div>

                {/* Quantity and Checkout Control Set */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-slate-100 bg-slate-50 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-90"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center text-sm font-medium tracking-wide text-slate-800">
                      {quantity.toString().padStart(2, "0")}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-slate-800 shadow-sm transition-all hover:bg-yellow-500 active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="h-12 rounded-full bg-yellow-400 px-8 text-sm font-medium tracking-wide text-slate-800 shadow-md shadow-yellow-200/40 transition-all hover:bg-yellow-500 active:scale-[0.98]"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}