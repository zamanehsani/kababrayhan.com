"use client";

import { JSX, useMemo } from "react";
import { Pizza, Beer, Beef, ChevronRight, ListChecks } from "lucide-react";
import { useGetItemsQuery } from "../../redux/api";

const categoryIconMap: Record<string, JSX.Element> = {
  Burgers: <Beef size={20} />,
  Pizzas: <Pizza size={20} />,
  Beverages: <Beer size={20} />,
  Default: <ListChecks size={20} />,
};

export default function TabletCategoryTabs() {
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
      { name: "All", icon: <ChevronRight size={20} />, active: true },
      ...sortedGroups.map((group) => ({
        name: group,
        icon: categoryIconMap[group] ?? categoryIconMap.Default,
        active: false,
      })),
    ];
  }, [items]);

  return (
    /* 
      Tablet Mode UI Constraint (768px - 1023px):
      - Standard layout spacing at mt-10 and px-8 matching your dashboard rhythm
    */
    <section className="mt-10 px-8">
      {/* Header Layout */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-2xl font-semibold tracking-wide text-slate-900">
          Categories
        </h3>
        <button className="flex items-center gap-1 text-base font-semibold tracking-wide text-slate-500 hover:text-slate-700 active:opacity-70 transition-colors">
          See all categories
          <ChevronRight size={16} />
        </button>
      </div>

      
      <div className="flex flex-wrap gap-x-4 gap-y-3 items-center justify-start">
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={`inline-flex items-center gap-2.5 rounded-full px-5 py-3 transition-all duration-200 active:scale-95 ${
              cat.active
                ? "bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-200/40"
                : "border border-slate-200 bg-white text-slate-600 active:bg-slate-50"
            }`}
          >
            {/* Icon Color Layer */}
            {cat.icon && (
              <span className={`transition-colors ${cat.active ? "text-slate-900" : "text-slate-400"}`}>
                {cat.icon}
              </span>
            )}
            
            {/* Typography Specification: No bold, clean semibold layout tracking */}
            <span className="text-base font-semibold tracking-wide">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
