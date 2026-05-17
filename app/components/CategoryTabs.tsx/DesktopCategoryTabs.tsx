"use client"

import { JSX, useMemo } from "react";
import { Pizza, Beer, Beef, ChevronRight, ListChecks } from "lucide-react";
import { useGetItemsQuery } from "../../redux/api";

const categoryIconMap: Record<string, JSX.Element> = {
  Burgers: <Beef size={22} />,
  Pizzas: <Pizza size={22} />,
  Beverages: <Beer size={22} />,
  Default: <ListChecks size={22} />,
};

export default function DesktopCategoryTabs() {
  const { data: items } = useGetItemsQuery();

  const categories = useMemo(() => {
    const groups = new Set<string>();

    items?.forEach((item) => {
      if (item.item_group) {
        groups.add(item.item_group);
      }
    });

    const sortedGroups = Array.from(groups).sort();
    return [
      { name: "All", icon: <ChevronRight size={22} />, active: true },
      ...sortedGroups.map((group) => ({
        name: group,
        icon: categoryIconMap[group] ?? categoryIconMap.Default,
        active: false,
      })),
    ];
  }, [items]);

  return (
    <section className="mt-12 max-w-[1440px] mx-auto px-12">
      {/* Header Layout */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-1">
          {/* Changed font-bold to font-semibold to match the soft system appearance */}
          <h3 className="text-2xl font-semibold tracking-wide text-slate-800">
            Explore Categories
          </h3>
          <p className="text-sm font-medium text-slate-400 tracking-wide">
            Filter your favorite items directly
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-base font-semibold tracking-wide text-slate-500 hover:text-orange-500 transition-colors group">
          View Full Menu
          <ChevronRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>

      {/* Premium Dashboard Grid Layout */}
      <div className="flex flex-wrap gap-6 items-center justify-start">
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-200 group relative ${
              cat.active
                ? "bg-yellow-400 text-slate-800 shadow-xl shadow-yellow-200/30"
                : "border border-slate-200/80 bg-white text-slate-700 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md hover:shadow-orange-100/30"
            }`}
          >
            {cat.icon && (
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  cat.active
                    ? "bg-white text-slate-900"
                    : "bg-white text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500"
                }`}
              >
                {cat.icon}
              </div>
            )}
            <span className="text-sm font-semibold tracking-wide">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
