"use client";

import { JSX, useEffect, useMemo, useRef, useState } from "react";
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
import { useGetItemsQuery } from "@/app/redux/api";

const categoryIconMap: Record<string, JSX.Element> = {
  All: <LayoutGrid size={22} />,
  Appetizers: <UtensilsCrossed size={22} />,
  "Main Course": <ChefHat size={22} />,
  "Ready to Grill": <Flame size={22} />,
  Rice: <Wheat size={22} />,
  Snacks: <Cookie size={22} />,
  Beverages: <CupSoda size={22} />,
  Drinks: <GlassWater size={22} />,
};

export default function DesktopCategoryTabs() {
  const { data: items } = useGetItemsQuery();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isPinned, setIsPinned] = useState(false);
  const [stickyBarHeight, setStickyBarHeight] = useState(0);
  const isManualScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const stickyBarRef = useRef<HTMLDivElement>(null);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const categories = useMemo(() => {
    const groups = new Set<string>();

    items?.forEach((item) => {
      if (item.item_group) {
        groups.add(item.item_group);
      }
    });

    // Define the specific order for categories
    const categoryOrder = [
      "Appetizers",
      "Main Course",
      "Rice",
      "Snacks",
      "Drinks",
      "platters",
      "Sides",
    ];

    const orderedGroups = categoryOrder.filter((cat) => groups.has(cat));
    const newGroups = Array.from(groups)
      .filter((cat) => !categoryOrder.includes(cat))
      .sort();

    return [
      { name: "All", icon: categoryIconMap.All },
      ...[...orderedGroups, ...newGroups].map((group) => ({
        name: group,
        icon: categoryIconMap[group] ?? categoryIconMap.All,
      })),
    ];
  }, [items]);

  const getVisibleCategorySections = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>("[data-category-section]")
    ).filter((section) => section.getClientRects().length > 0);

  useEffect(() => {
    const updateActiveCategoryFromScroll = () => {
      if (isManualScrolling.current) return;

      const sections = getVisibleCategorySections();
      if (sections.length === 0) return;

      // Desktop viewport can intersect multiple sections at once; pick the last section
      // that has crossed the threshold line.
      let nextActive = "All";
      const threshold = 180;

      sections.forEach((section) => {
        const top = section.getBoundingClientRect().top;
        if (top <= threshold) {
          const name = section.dataset.categoryName;
          if (name) nextActive = name;
        }
      });

      setActiveCategory(nextActive);
    };

    updateActiveCategoryFromScroll();
    window.addEventListener("scroll", updateActiveCategoryFromScroll, {
      passive: true,
    });
    window.addEventListener("resize", updateActiveCategoryFromScroll);

    return () => {
      window.removeEventListener("scroll", updateActiveCategoryFromScroll);
      window.removeEventListener("resize", updateActiveCategoryFromScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [categories]);

  useEffect(() => {
    const updatePinnedState = () => {
      if (stickyBarRef.current) {
        setStickyBarHeight(stickyBarRef.current.offsetHeight);
      }

      if (stickySentinelRef.current) {
        setIsPinned(stickySentinelRef.current.getBoundingClientRect().top <= 0);
      }
    };

    updatePinnedState();
    window.addEventListener("scroll", updatePinnedState, { passive: true });
    window.addEventListener("resize", updatePinnedState);

    return () => {
      window.removeEventListener("scroll", updatePinnedState);
      window.removeEventListener("resize", updatePinnedState);
    };
  }, []);

  const stickyPositionClass = isPinned ? "fixed inset-x-0 top-0" : "relative";

  return (
    <section className="max-w-[1440px] mx-auto px-8">
      {/* Header Layout */}
      
      {/* Premium Dashboard Grid Layout */}
      <div ref={stickySentinelRef}>
        <div
          ref={stickyBarRef}
          className={`${stickyPositionClass} z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 pb-2 pt-2 left-0 right-0 w-full`}
        >
          {/* Centering Wrapper: Controls the maximum layout width */}
          <div
            className={`mx-auto max-w-full w-full ${
              isPinned ? "px-2 md:px-12" : ""
            }` }
          >
            {/* Scroll Container: Centers buttons when few, allows overflow when many */}
            <div className="flex flex-nowrap py-2 gap-6 items-center justify-start md:justify-center overflow-x-auto no-scrollbar scroll-smooth">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.name);
                    isManualScrolling.current = true;
                    if (scrollTimeoutRef.current)
                      clearTimeout(scrollTimeoutRef.current);
                    const visibleSections = getVisibleCategorySections();
                    const targetByData = visibleSections.find(
                      (section) => section.dataset.categoryName === cat.name
                    );
                    const targetId = `category-${slugify(cat.name)}`;
                    const targetById = visibleSections.find(
                      (section) => section.id === targetId
                    );
                    const target =
                      targetByData ??
                      targetById ??
                      document.getElementById(targetId);
                    if (target) {
                      const targetTop =
                        target.getBoundingClientRect().top + window.scrollY;
                      const offset =
                        (stickyBarRef.current?.offsetHeight ?? 0) + 16;
                      window.scrollTo({
                        top: Math.max(0, targetTop - offset),
                        behavior: "smooth",
                      });
                    }
                    scrollTimeoutRef.current = setTimeout(() => {
                      isManualScrolling.current = false;
                    }, 1000);
                  }}
                  className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-3 py-2 transition-all duration-200 group relative ${
                    activeCategory === cat.name
                      ? "bg-yellow-400 text-slate-800 shadow-xl shadow-yellow-200/30"
                      : "border border-slate-200/80 bg-white text-slate-700 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md hover:shadow-orange-100/30"
                  }`}
                >
                  {cat.icon && (
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                        activeCategory === cat.name
                          ? " text-slate-800"
                          : " text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500"
                      }`}
                    >
                      {cat.icon}
                    </div>
                  )}
                  <span className="text-sm font-normal tracking-wide">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {isPinned && (
          <div style={{ height: `${stickyBarHeight}px` }} aria-hidden="true" />
        )}
      </div>
    </section>
  );
}
