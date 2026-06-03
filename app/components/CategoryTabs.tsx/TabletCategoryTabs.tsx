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
  All: <LayoutGrid size={20} />,
  Appetizers: <UtensilsCrossed size={20} />,
  "Main Course": <ChefHat size={20} />,
  "Ready to Grill": <Flame size={20} />,
  Rice: <Wheat size={20} />,
  Snacks: <Cookie size={20} />,
  Beverages: <CupSoda size={20} />,
  Drinks: <GlassWater size={20} />,
};

export default function TabletCategoryTabs() {
  const { data: items } = useGetItemsQuery();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isPinned, setIsPinned] = useState(false);
  const [stickyBarHeight, setStickyBarHeight] = useState(0);
  const isManualScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
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
    let observer: IntersectionObserver | null = null;

    const connectObserver = () => {
      observer?.disconnect();
      const sections = getVisibleCategorySections();
      if (sections.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          if (isManualScrolling.current) return;
          const intersectingEntry = entries.find(
            (entry) => entry.isIntersecting
          );
          if (intersectingEntry) {
            const name =
              intersectingEntry.target.getAttribute("data-category-name");
            if (name) setActiveCategory(name);
          }
        },
        { rootMargin: "-120px 0px -70% 0px", threshold: 0 }
      );

      sections.forEach((section) => observer?.observe(section));
    };

    connectObserver();
    window.addEventListener("resize", connectObserver);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", connectObserver);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [categories]);

  useEffect(() => {
    if (!tabContainerRef.current) return;

    const activeButton = tabContainerRef.current.querySelector(
      `[data-tab-name="${activeCategory}"]`
    );

    if (activeButton) {
      const container = tabContainerRef.current;
      const btn = activeButton as HTMLElement;
      const containerLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.clientWidth;

      if (
        btnLeft < containerLeft ||
        btnLeft + btnWidth > containerLeft + containerWidth
      ) {
        container.scrollTo({
          left: btnLeft - containerWidth / 2 + btnWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [activeCategory]);

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

  const handleTabClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    isManualScrolling.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    const visibleSections = getVisibleCategorySections();
    const targetByData = visibleSections.find(
      (section) => section.dataset.categoryName === categoryName
    );
    const targetId = `category-${slugify(categoryName)}`;
    const targetById = visibleSections.find(
      (section) => section.id === targetId
    );
    const target =
      targetByData ?? targetById ?? document.getElementById(targetId);

    if (target) {
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      const offset = (stickyBarRef.current?.offsetHeight ?? 0) + 20;
      window.scrollTo({
        top: Math.max(0, targetTop - offset),
        behavior: "smooth",
      });
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 1200);
  };

  return (
    /* 
      Tablet Mode UI Constraint (768px - 1023px):
      - Standard layout spacing at mt-10 and px-8 matching your dashboard rhythm
    */
    <section className="px-8">
      {/* Header Layout */}
      
      <div ref={stickySentinelRef}>
        <div
          ref={stickyBarRef}
          className={`${
            isPinned ? "fixed top-0" : "relative"
          } z-40 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/70 pb-4 pt-4 left-0 right-0 w-full`}
        >
          {/* Centering Wrapper: Controls the maximum layout width matching your desktop design */}
          <div className={`mx-auto max-w-7xl w-full ${isPinned ? "px-8" : ""}`}>
            {/* Scroll Container: Centers buttons when few, allows overflow when many */}
            <div
              ref={tabContainerRef}
              className="flex gap-x-2 gap-y-2 items-center justify-start md:justify-center overflow-x-auto no-scrollbar scroll-smooth"
            >
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  data-tab-name={cat.name}
                  onClick={() => handleTabClick(cat.name)}
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 transition-all duration-200 active:scale-95 ${
                    activeCategory === cat.name
                      ? "bg-red-600 text-slate-900 shadow-lg shadow-red-200/40"
                      : "border border-slate-200 bg-white text-slate-600 active:bg-slate-50"
                  }`}
                >
                  {/* Icon Color Layer */}
                  {cat.icon && (
                    <span
                      className={`transition-colors ${
                        activeCategory === cat.name
                          ? "text-slate-900"
                          : "text-slate-400"
                      }`}
                    >
                      {cat.icon}
                    </span>
                  )}

                  {/* Typography Specification: No bold, clean semibold layout tracking */}
                  <span className="text-base font-normal tracking-wide">
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
