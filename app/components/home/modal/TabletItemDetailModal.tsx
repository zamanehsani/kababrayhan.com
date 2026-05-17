import { X, Clock, Flame, Heart, Minus, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Dish } from "@/app/types/type";
import { addDishToCart } from "@/app/lib/cart";


export function TabletItemDetailModal({
  dish,
  onClose,
}: Readonly<{
  dish: Dish;
  onClose: () => void;
}>) {
  const [quantity, setQuantity] = useState(1);

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
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Main Modal Container */}
      <div 
        className="relative z-10 flex flex-col w-full max-w-xl h-auto max-h-[85vh] rounded-[2.5rem] bg-white shadow-2xl overflow-y-auto no-scrollbar border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Actions Container */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <button
            onClick={onClose}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-100/10 bg-white/80 text-slate-800 backdrop-blur-md shadow-sm active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
          <button className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-100/10 bg-white/80 text-red-500 backdrop-blur-md shadow-sm active:scale-95 transition-all">
            <Heart size={18} fill={dish.liked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Hero image canvas */}
        <div className="relative w-full aspect-[16/10] bg-slate-50/50 flex items-center justify-center p-6 border-b border-slate-50">
          <div className="absolute inset-0 scale-120 blur-3xl opacity-20 pointer-events-none">
            <Image src={dish.img} alt="" fill className="object-cover" />
          </div>
          <div className="relative w-full h-full">
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
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
                {dish.restaurant}
              </span>
              <h1 className="text-2xl font-semibold text-slate-800 tracking-wide mt-0.5">
                {dish.name}
              </h1>
            </div>
            <span className="text-2xl font-semibold text-emerald-600 tracking-wide shrink-0">
              ${dish.price}
            </span>
          </div>

          {/* Quick Metrics Badge Row */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100/80">
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-orange-500" />
              <span>{dish.cal} kcal</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              <span>{dish.time}</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span>{dish.rating} Rating</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-800 mb-1">
              Description
            </h3>
            <p className="text-sm leading-relaxed tracking-wide text-slate-400 font-sans">
              {dish.description}
            </p>
          </div>
        </div>

        {/* Footer control bracket */}
        <div className="mt-auto p-6 border-t border-slate-50 flex items-center gap-4 bg-white sticky bottom-0">
          <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm active:scale-90 transition-all"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center font-semibold tracking-wide text-sm text-slate-800">
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
            className="flex-1 h-12 bg-yellow-400 text-slate-800 rounded-full font-semibold text-sm tracking-wide shadow-md shadow-yellow-200/40 active:scale-[0.98] transition-all"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}