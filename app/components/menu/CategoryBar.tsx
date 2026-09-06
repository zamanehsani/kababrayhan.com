"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import {
  ChefHat,
  Cookie,
  CupSoda,
  Flame,
  GlassWater,
  LayoutGrid,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import { sortGroupNamesByItemGroupPriority } from "@/app/lib/itemGroupOrdering";

type ItemGroup = { name: string; custom_priority: number };

const ICON_MAP: Record<string, JSX.Element> = {
  All: <LayoutGrid size={20} />,
  Appetizers: <UtensilsCrossed size={20} />,
  "Main Course": <ChefHat size={20} />,
  "Ready to Grill": <Flame size={20} />,
  Rice: <Wheat size={20} />,
  Snacks: <Cookie size={20} />,
  Beverages: <CupSoda size={20} />,
  Drinks: <GlassWater size={20} />,
};

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function CategoryBar({ groups }: { groups: ItemGroup[] }) {
  const [active, setActive] = useState("All");
  const [isPinned, setIsPinned] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const isManualRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = useMemo(() => {
    const sorted = sortGroupNamesByItemGroupPriority(
      groups.map((g) => g.name),
      groups
    );
    return [
      { name: "All", icon: ICON_MAP["All"] },
      ...sorted.map((name) => ({
        name,
        icon: ICON_MAP[name] ?? <LayoutGrid size={20} />,
      })),
    ];
  }, [groups]);

  // Sticky sentinel: detect when bar should pin below header
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const isLg = window.innerWidth >= 1024;
    const isMd = window.innerWidth >= 768;
    const headerH = isLg ? 80 : isMd ? 96 : 0;
    const obs = new IntersectionObserver(
      ([entry]) => setIsPinned(!entry.isIntersecting),
      { rootMargin: headerH > 0 ? `-${headerH}px 0px 0px 0px` : "0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scroll-spy: update active tab as user scrolls through sections
  useEffect(() => {
    const barHeight = barRef.current?.offsetHeight ?? 60;
    const isLg = typeof window !== "undefined" && window.innerWidth >= 1024;
    const isMd = typeof window !== "undefined" && window.innerWidth >= 768;
    const headerH = isLg ? 80 : isMd ? 96 : 0;
    const topOffset = barHeight + headerH;
    const sections = document.querySelectorAll("[data-category-section]");
    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (isManualRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          const name =
            visible[0].target.getAttribute("data-category-name") ?? "All";
          setActive(name);
        }
      },
      { rootMargin: `-${topOffset + 1}px 0px -60% 0px`, threshold: 0 }
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [categories]);

  function scrollToCategory(name: string) {
    isManualRef.current = true;
    setActive(name);

    const id =
      name === "All" ? "category-all" : `category-${slugify(name)}`;
    const element = document.getElementById(id);
    if (element) {
      const isLg = window.innerWidth >= 1024;
      const isMd = window.innerWidth >= 768;
      const headerH = isLg ? 80 : isMd ? 96 : 0;
      const barHeight = barRef.current?.offsetHeight ?? 60;
      const topOffset = barHeight + headerH;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - topOffset - 12),
        behavior: "smooth",
      });
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isManualRef.current = false;
    }, 1200);
  }

  return (
    <>
      <div ref={sentinelRef} className="h-px" />
      <div
        ref={barRef}
        className={`sticky top-0 md:top-20 lg:top-20 z-30 bg-white/95 backdrop-blur-md transition-shadow ${
          isPinned
            ? "border-b border-slate-100 shadow-sm"
            : ""
        }`}
      >
        <div className="no-scrollbar mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 py-3 lg:px-12">
          {categories.map((cat) => {
            const isActive = active === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => scrollToCategory(cat.name)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.icon}
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
