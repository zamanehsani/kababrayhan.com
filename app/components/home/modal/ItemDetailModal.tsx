import {
  ChevronLeft,
  Clock,
  Flame,
  Heart,
  Minus,
  Plus,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Dish } from "@/app/types/type";
import { addDishToCart } from "@/app/lib/cart";


export // FULL SCREEN DETAIL MODAL COMPONENT
function ItemDetailModal({
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
    <div
      className="fixed inset-0 z-250 flex flex-col bg-white overflow-y-auto no-scrollbar"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-details-title"
    >
      {/* 1. TOP ACTION BAR */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-800 shadow-sm active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <h2
          id="dish-details-title"
          className="text-2xl font-semibold text-slate-800"
        >
          Details
        </h2>
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white text-red-500 shadow-sm active:scale-95">
          <Heart size={20} fill={dish.liked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* 2. DISH HERO IMAGE */}
      <div className="relative w-full aspect-[4/3] flex items-center justify-center px-6">
        {/* The Background Blur Layer */}
        <div className="absolute inset-0 scale-150 blur-3xl opacity-30 pointer-events-none transform">
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

      {/* CAROUSEL DOTS INDICATOR */}
      <div className="flex justify-center gap-1.5 mb-4">
        <span className="h-1.5 w-3 rounded-full bg-yellow-400"></span>
        <span className="h-1.5 w-1.5 rounded-full bg-slate-200"></span>
      </div>

      {/* 3. RESTAURANT BANNER CARD */}
      <div className="mx-4 mb-2 flex items-center justify-between rounded-2xl bg-orange-50/60 border border-orange-100/50 p-4">
        <div>
          <h4 className="text-2xl font-medium text-slate-800 tracking-wide">
            {dish.restaurant}
          </h4>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {dish.tags}
          </p>
        </div>
        <button className="rounded-full bg-yellow-400 px-4 py-1.5 text-xs font-bold text-slate-900 active:scale-95">
          View
        </button>
      </div>

      {/* 4. DISH NAME AND PRICE TITLE */}
      <div className="flex items-start justify-between px-5 mb-4">
        <h1 className="text-2xl font-medium text-slate-800 tracking-wide max-w-[70%]">
          {dish.name}
        </h1>
        <span className="text-2xl font-semibold text-emerald-600">
          <span className="text-2xl font-semibold mr-0.5">$</span>
          {dish.price}
        </span>
      </div>

      {/* 5. QUICK METRICS (Calories, Time, Rating) */}
      <div className="flex items-center justify-between px-5 py-3 border-y border-slate-100 mb-2 text-slate-600 text-xs font-semibold">
        <div className="flex items-center gap-1">
          <Flame size={14} className="text-orange-500" />
          <span>{dish.cal} calories</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-200"></div>
        <div className="flex items-center gap-1">
          <Clock size={14} className="text-slate-400" />
          <span>Time {dish.time}</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-200"></div>
        <div className="flex items-center gap-1">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span>{dish.rating} Rating</span>
        </div>
      </div>

      {/* 6. DESCRIPTION SECTION */}
      <div className="px-5 mb-2">
        <h3 className="text-base font-semibold tracking-wide text-slate-800 mb-2">
          Description
        </h3>
        <p className="text-sm font-sans leading-relaxed tracking-wide text-slate-400">
          {dish.description}
        </p>
      </div>

      {/* 7. CUSTOMIZE LINK */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100/80 mb-auto">
        <span className="text-sm font-semibold tracking-wide text-slate-800">
          Customize
        </span>
        <button className="text-xs font-semibold tracking-wide text-yellow-500 flex items-center gap-0.5">
          More Details
          <span className="text-[10px]">▼</span>
        </button>
      </div>

      {/* 8. BOTTOM QUANTITY AND PURCHASE PANEL */}
      <div className="mt-auto bg-white px-4 pt-4 pb-8 flex items-center gap-4 border-t border-slate-50">
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-slate-800 shadow-sm active:scale-90"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 h-12 bg-yellow-400 text-slate-800 rounded-full font-semibold text-sm tracking-wide shadow-md shadow-yellow-200/50 active:scale-[0.98] transition-transform"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
