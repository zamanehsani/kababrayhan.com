"use client";

import { JSX, useMemo } from "react";
import { Pizza, Beer, Beef, ChevronRight, ListChecks } from "lucide-react";
import { useGetItemsQuery } from "../../redux/api";

const categoryIconMap: Record<string, JSX.Element> = {
  Burgers: <Beef size={18} />,
  Pizzas: <Pizza size={18} />,
  Beverages: <Beer size={18} />,
  Default: <ListChecks size={18} />,
};

export default function CategoryTabs() {
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
      { name: "All", icon: <ChevronRight size={18} />, active: true },
      ...sortedGroups.map((group) => ({
        name: group,
        icon: categoryIconMap[group] ?? categoryIconMap.Default,
        active: false,
      })),
    ];
  }, [items]);

  return (
    <section className="mt-8">
      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between px-4">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">
          Categories
        </h3>
        <button className="flex items-center gap-1 text-sm font-medium text-slate-500 active:opacity-70">
          See all
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Categories Scroll */}
      <div className="flex gap-3 overflow-hidden px-4 pb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-full px-5 py-3 transition-all ${
              cat.active
                ? "bg-yellow-400 text-slate-900 shadow-md shadow-yellow-200/50"
                : "border border-slate-100 bg-white text-slate-600 active:bg-slate-50"
            }`}
          >
            {/* Icon color logic */}
            {cat.icon && (

              <span className={cat.active ? "text-slate-900" : "text-slate-400"}>
              {cat.icon}
            </span>
            )}

            {/* Typography: Using text-sm and font-semibold for a cleaner look */}
            <span className="text-sm font-semibold tracking-wide">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

