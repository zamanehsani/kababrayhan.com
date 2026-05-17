import { X, Clock, Flame, Heart, Minus, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Dish } from "@/app/types/type";
import { addDishToCart } from "@/app/lib/cart";


export function DesktopItemDetailModal({
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
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-12">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Premium Split-Pane Frame */}
      <div 
        className="relative z-10 grid grid-cols-12 w-full max-w-4xl h-[560px] rounded-[2.5rem] bg-white shadow-2xl overflow-hidden border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button Anchor */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-md border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: Visual Asset Frame */}
        <div className="col-span-5 relative bg-slate-50/60 flex items-center justify-center p-8 border-r border-slate-100/80">
          <div className="absolute inset-0 scale-120 blur-3xl opacity-20 pointer-events-none">
            <Image src={dish.img} alt="" fill className="object-cover" />
          </div>
          <div className="relative w-full h-full transition-transform duration-500 hover:scale-105">
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
        <div className="col-span-7 flex flex-col p-8 bg-white h-full overflow-y-auto no-scrollbar">
          
          {/* Header Data Group */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
                {dish.restaurant}
              </span>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-wide mt-1">
                {dish.name}
              </h1>
            </div>
            
            <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-white text-red-500 shadow-sm hover:scale-105 active:scale-95 transition-transform">
              <Heart size={18} fill={dish.liked ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Metric Badges Stack */}
          <div className="flex items-center gap-5 text-sm font-semibold text-slate-500 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100/60 mb-6 w-fit">
            <div className="flex items-center gap-1.5">
              <Flame size={15} className="text-orange-500" />
              <span>{dish.cal} kcal</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-slate-400" />
              <span>{dish.time}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <Star size={15} className="text-yellow-400 fill-yellow-400" />
              <span className="text-slate-800">{dish.rating}</span>
            </div>
          </div>

          {/* Description Block */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold tracking-wide text-slate-800 mb-1.5">
              Description
            </h3>
            <p className="text-sm leading-relaxed tracking-wide text-slate-400 font-sans">
              {dish.description}
            </p>
          </div>

          {/* Price View Layout */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-400 tracking-wide">Total Price</span>
              <span className="text-3xl font-semibold text-emerald-600 tracking-wide">
                ${(Number(dish.price) * quantity).toFixed(2)}
              </span>
            </div>

            {/* Quantity and Checkout Control Set */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm hover:bg-slate-50 active:scale-90 transition-all"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center font-semibold tracking-wide text-sm text-slate-800">
                  {quantity.toString().padStart(2, "0")}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-slate-800 shadow-sm hover:bg-yellow-500 active:scale-90 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="h-12 px-8 bg-yellow-400 text-slate-800 rounded-full font-semibold text-sm tracking-wide shadow-md shadow-yellow-200/40 hover:bg-yellow-500 active:scale-[0.98] transition-all"
              >
                Add to Cart
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}