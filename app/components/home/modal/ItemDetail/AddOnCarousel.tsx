"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { DirhamIcon } from "@/app/components/icon/DirhamIcon";

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
          className={`grid w-full ${isOverflowing ? "gap-2 overflow-x-auto scroll-smooth px-2 pb-0" : "grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-3"}`}
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
                singleSelect={singleSelect}
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
  singleSelect,
}: {
  option: AddOnOption;
  isOverflowing: boolean;
  selected: boolean;
  onClick: () => void;
  singleSelect: boolean;
}) {
  // Hover-scale approach: scale the whole card and reveal the full title by removing truncate on hover.
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ease-out ${isOverflowing ? "w-56 shrink-0" : "w-full"} ${
        selected
          ? "border-red-500 bg-red-50/60 shadow-sm"
          : "border-slate-200 bg-transparent hover:border-red-300 hover:bg-slate-50/40"
      } ${singleSelect ? "cursor-pointer" : "cursor-default"} active:scale-[0.98]`}
    >
      <div className={`flex items-center ${isOverflowing ? "p-3" : "p-2"}`}>
        <div className="min-w-0 flex-1 text-left">
          <p className={`font-semibold text-slate-900 antialiased ${isOverflowing ? "text-[14px]" : "text-[13px]"} whitespace-normal break-words`}>
            {option.name}
          </p>
          {option.price > 0 && (
            <div className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-red-600">
              <DirhamIcon className="h-3.75 w-3.75" />
              <span>{option.price.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
