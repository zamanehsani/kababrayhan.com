import { Minus, Plus } from "lucide-react";
import DirhamIcon from "../../../icon/DirhamIcon";

interface DesktopItemPriceBarProps {
  totalPrice: string;
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  canAddToCart: boolean;
  variantGateMessage: string;
  onAddToCart: () => void;
}

export function DesktopItemPriceBar({
  totalPrice,
  quantity,
  onDecrement,
  onIncrement,
  canAddToCart,
  variantGateMessage,
  onAddToCart,
}: Readonly<DesktopItemPriceBarProps>) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-white px-8 py-5">
      <div className="flex flex-col">
        <span className="text-xs font-normal tracking-wide text-slate-400">
          Total Price
        </span>
        <span className="flex items-center text-3xl font-medium tracking-wide text-red-600">
          <DirhamIcon size={22} className="mr-1 text-red-600" />
          {totalPrice}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-slate-100 bg-slate-50 p-1">
          <button
            onClick={onDecrement}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-90"
          >
            <Minus size={14} />
          </button>
          <span className="w-12 text-center text-sm font-medium tracking-wide text-slate-800">
            {quantity.toString().padStart(2, "0")}
          </span>
          <button
            onClick={onIncrement}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-all hover:bg-red-500 active:scale-90"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={!canAddToCart}
          className={`h-12 rounded-full px-8 text-sm font-medium tracking-wide shadow-md transition-all ${
            canAddToCart
              ? "bg-red-600 text-white shadow-red-200/40 hover:bg-red-500 active:scale-[0.98]"
              : "cursor-not-allowed bg-slate-200 text-slate-500 shadow-slate-100"
          }`}
        >
          {canAddToCart
            ? "Add to cart"
            : variantGateMessage || "Choose required options"}
        </button>
      </div>
    </div>
  );
}
