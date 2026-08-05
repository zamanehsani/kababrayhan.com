"use client";

import Image from "next/image";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect, useState } from "react";

type AddOnOption = {
  id: string;
  name: string;
  img?: string;
  price: number;
};

type AddOnGroup = {
  id: string;
  name: string;
  options: AddOnOption[];
};

type Props = {
  group: AddOnGroup;
  selections: string[];
  onToggle: (optionId: string) => void;
  singleSelect?: boolean;
};

export function AddOnCarousel({
  group,
  selections,
  onToggle,
  singleSelect = false,
}: Props) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = () => {
    const el = sliderRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollWidth > el.clientWidth + 1);
  };

  useEffect(() => {
    checkOverflow();
    const ro = new ResizeObserver(() => checkOverflow());
    if (sliderRef.current) ro.observe(sliderRef.current);
    window.addEventListener("resize", checkOverflow);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="mb-3">
      {group.name && (
        <div className="mb-1 flex items-center justify-between">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {group.name}
          </h5>

          <span className="text-[11px] text-slate-400">{group.options.length} items</span>
        </div>
      )}

      <div className="relative">
        {isOverflowing && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 backdrop-blur-sm transition hover:border-red-300 hover:bg-white active:scale-95"
          >
            <ChevronLeft size={15} className="text-slate-700" />
          </button>
        )}

        {isOverflowing && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 backdrop-blur-sm transition hover:border-red-300 hover:bg-white active:scale-95"
          >
            <ChevronRight size={15} className="text-slate-700" />
          </button>
        )}

        <div
          ref={sliderRef}
          className={`flex ${isOverflowing ? "gap-2 overflow-x-auto scroll-smooth px-2 pb-0" : "flex-wrap gap-1"}`}
        >
          {group.options.map((option) => {
            const selected = selections.includes(option.id);

            const handleClick = () => onToggle(option.id);

            return (
              <OptionCard
                key={option.id}
                option={option}
                isOverflowing={isOverflowing}
                selected={selected}
                onClick={handleClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  option,
  isOverflowing,
  selected,
  onClick,
}: {
  option: AddOnOption;
  isOverflowing: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  // Hover-scale approach: scale the whole card and reveal the full title by removing truncate on hover.
  return (
    <button
      type="button"
      onClick={onClick}
      // use GPU transform and avoid changing width to prevent layout jumps
      className={`group relative overflow-visible ${isOverflowing ? "shrink-0 w-56" : "w-40"} border transition-all duration-500 ease-out transform-gpu will-change-transform ${
        selected
          ? "border-red-500 bg-red-50/60 shadow-sm"
          : "border-slate-200 bg-transparent hover:border-red-300 hover:bg-slate-50/40"
      } hover:scale-105 hover:z-30`}
      style={{ backfaceVisibility: "hidden" }}
    >
      <div className={`flex items-center gap-2 ${isOverflowing ? "p-2" : "p-1"}`}>
        <div className={`${isOverflowing ? "h-12 w-12" : "h-10 w-10"} relative shrink-0 overflow-hidden rounded-lg bg-slate-100`}>
          {option.img ? (
            <Image src={option.img} alt={option.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-slate-400">N/A</div>
          )}
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className={`font-semibold text-slate-900 antialiased ${isOverflowing ? "text-[13px]" : "text-[12px]"} truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all duration-300 delay-200`}>{option.name}</p>
          {option.price > 0 && (
            <p className={`mt-0.5 font-semibold text-red-600 ${isOverflowing ? "text-[11px]" : "text-[10px]"}`}>
              +{option.price.toFixed(2)}
            </p>
          )}
        </div>

        <div className={`flex ${isOverflowing ? "h-6 w-6" : "h-5 w-5"} shrink-0 items-center justify-center rounded-full border transition-all ${
          selected ? "border-red-500 bg-red-500 text-white" : "border-slate-300 bg-transparent"
        }`}>
          {selected && <Check size={13} strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}
