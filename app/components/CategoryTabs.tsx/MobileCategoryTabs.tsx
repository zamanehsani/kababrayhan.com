"use client";

import { JSX, useEffect, useMemo, useState, useRef } from "react";
import {
  Beef,
  ChevronRight,
  CupSoda,
  Droplet,
  GlassWater,
  IceCream,
  LayoutGrid,
  ListChecks,
  Package,
  Pizza,
  User,
  Users,
} from "lucide-react";
import { useGetItemsQuery } from "../../redux/api";

const categoryIconMap: Record<string, JSX.Element> = {
  All: <LayoutGrid size={18} />,
  Burgers: <Beef size={18} />,
  Pizzas: <Pizza size={18} />,
  Beverages: <CupSoda size={18} />,
  Desserts: <IceCream size={18} />,
  Dips: <Droplet size={18} />,
  Drinks: <GlassWater size={18} />,
  "For Friends": <Users size={18} />,
  "For You": <User size={18} />,
  Products: <Package size={18} />,
  Default: <ListChecks size={18} />,
};

export default function CategoryTabs() {
  const { data: items } = useGetItemsQuery();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isPinned, setIsPinned] = useState(false);
  const [stickyBarHeight, setStickyBarHeight] = useState(0);
  
  // Prevent IntersectionObserver from triggering active tab changes during a click-scroll operation
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

    const sortedGroups = Array.from(groups).sort();
    return [
      { name: "All", icon: categoryIconMap.All },
      ...sortedGroups.map((group) => ({
        name: group,
        icon: categoryIconMap[group] ?? categoryIconMap.Default,
      })),
    ];
  }, [items]);

  const getVisibleCategorySections = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>("[data-category-section]")
    ).filter((section) => section.getClientRects().length > 0);

  // Hook 1: Handle IntersectionObserver tracking user viewport scrolling
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const connectObserver = () => {
      observer?.disconnect();
      const sections = getVisibleCategorySections();
      if (sections.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          // Ignore observations if the user explicitly clicked a button track item
          if (isManualScrolling.current) return;

          // Find the section that is currently taking over the top interactive margin area
          const intersectingEntry = entries.find((entry) => entry.isIntersecting);

          if (intersectingEntry) {
            const name = intersectingEntry.target.getAttribute("data-category-name");
            if (name) setActiveCategory(name);
          }
        },
        {
          // Root margins map: Triggers precisely when the item header passes just beneath the sticky nav container (top header threshold offset)
          rootMargin: "-120px 0px -70% 0px",
          threshold: 0,
        }
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

  // Hook 2: Keep the active category button scrolled into view horizontally within the sticky nav track
  useEffect(() => {
    if (!tabContainerRef.current) return;

    const activeButton = tabContainerRef.current.querySelector(
      `[data-tab-name="${activeCategory}"]`
    );

    if (activeButton) {
      const container = tabContainerRef.current;
      const btn = activeButton as HTMLElement;

      // Calculate relative horizontal positions
      const containerLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.clientWidth;

      // Scroll left only if the button item drifts out of visibility parameters
      if (btnLeft < containerLeft || btnLeft + btnWidth > containerLeft + containerWidth) {
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
    
    // Lock the observer
    isManualScrolling.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    const visibleSections = getVisibleCategorySections();
    const targetByData = visibleSections.find(
      (section) => section.dataset.categoryName === categoryName
    );
    const targetId = `category-${slugify(categoryName)}`;
    const targetById = visibleSections.find((section) => section.id === targetId);
    const target = targetByData ?? targetById ?? document.getElementById(targetId);

    if (target) {
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      const offset = (stickyBarRef.current?.offsetHeight ?? 0) + 12;
      window.scrollTo({
        top: Math.max(0, targetTop - offset),
        behavior: "smooth",
      });
    }

    // Release the lock once the native window scrolling completes
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 800); 
  };

  return (
    <section className="mt-8">
      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between px-4">
        <h3 className="text-xl font-normal tracking-wide text-slate-900">
          Categories
        </h3>
        {/* <button className="flex items-center gap-1 text-sm font-normal text-slate-500 active:opacity-70">
          See all
          <ChevronRight size={14} />
        </button> */}
      </div>

      {/* Sticky-on-threshold category bar */}
      <div ref={stickySentinelRef}>
        <div
          ref={stickyBarRef}
          className={`${
            isPinned ? "fixed inset-x-0 top-0" : "relative"
          } z-40 px-4 pb-3 pt-2 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 border-b border-slate-100/40 transition-all`}
        >
          <div
            ref={tabContainerRef}
            className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                data-tab-name={cat.name}
                onClick={() => handleTabClick(cat.name)}
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 transition-all duration-200 select-none ${
                  activeCategory === cat.name
                    ? "bg-yellow-400 text-slate-900 shadow-md shadow-yellow-200/60 font-bold scale-100"
                    : "border border-slate-100 bg-white text-slate-600 font-semibold hover:border-slate-200 active:bg-slate-50 text-sm"
                }`}
              >
                {cat.icon && (
                  <span
                    className={`transition-colors duration-200 ${
                      activeCategory === cat.name ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {cat.icon}
                  </span>
                )}

                <span className="text-sm font-normal tracking-wide">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        {isPinned && <div style={{ height: `${stickyBarHeight}px` }} aria-hidden="true" />}
      </div>
    </section>
  );
}


