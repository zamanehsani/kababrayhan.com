"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Flame } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Item } from "@/app/redux/apiType";
import type { Dish } from "@/app/types/type";
import { sortGroupNamesByItemGroupPriority } from "@/app/lib/itemGroupOrdering";
import { useScreenMode } from "@/app/lib/useScreenMode";
import { baseUrl as ERP_BASE_URL } from "@/app/redux/api";
import DirhamIcon from "@/app/components/icon/DirhamIcon";
import { DesktopItemDetailModal } from "@/app/components/home/modal/ItemDetail/DesktopItemDetailModal";
import { TabletItemDetailModal } from "@/app/components/home/modal/ItemDetail/TabletItemDetailModal";
import { ItemDetailModal } from "@/app/components/home/modal/ItemDetail/ItemDetailModal";

type ItemGroup = { name: string; custom_priority: number };

type Props = {
  items: Item[];
  groups: ItemGroup[];
};

function resolveDishImage(value?: string): string {
  if (!value?.trim()) return "/popular-dishes/burger.png";
  if (/^https?:\/\//i.test(value)) return value;
  const parts = value
    .split("/")
    .map((p) => (p ? encodeURIComponent(p) : ""));
  const path = parts.join("/");
  return `${ERP_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function itemToDish(item: Item): Dish {
  return {
    id: item.item_code || item.name,
    name: item.item_name ?? item.name ?? "Menu Item",
    price: item.standard_rate?.toFixed(2) ?? "0.00",
    cal: item.custom_calories?.toString() ?? "170",
    time: item.custom_prep_time ? `${item.custom_prep_time} min` : "15-20 min",
    rating: "4.7",
    restaurant: item.item_group ?? "Popular",
    tags: item.item_group
      ? `${item.item_group} • Popular`
      : "Chef's Choice • Popular",
    description:
      item.description ?? "A delicious selection from our menu.",
    img: resolveDishImage(item.image),
    custom_prep_time: item.custom_prep_time,
    liked: false,
    hasVariants:
      typeof item.has_variants === "number"
        ? item.has_variants === 1
        : Boolean(item.has_variants),
  };
}

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function ItemsGrid({ items, groups }: Props) {
  const [selected, setSelected] = useState<Dish | null>(null);
  const screenMode = useScreenMode();
  const searchParams = useSearchParams();
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();

  const dishes = useMemo(
    () =>
      items
        .filter((i) => !i.variant_of && i.disabled !== 1 && i.docstatus !== 1)
        .map(itemToDish),
    [items]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Dish[]>();
    const src = search
      ? dishes.filter((d) =>
          [d.name, d.restaurant, d.tags, d.description]
            .join(" ")
            .toLowerCase()
            .includes(search)
        )
      : dishes;

    src.forEach((d) => {
      const g = d.restaurant || "Popular";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(d);
    });

    const ordered = sortGroupNamesByItemGroupPriority(
      Array.from(map.keys()),
      groups
    );
    return ordered.map((name) => ({ name, items: map.get(name) ?? [] }));
  }, [dishes, groups, search]);

  if (search && grouped.length === 0) {
    return (
      <section className="mx-auto max-w-[1440px] px-4 py-16 text-center lg:px-12">
        <p className="text-slate-500">
          No dishes found for <strong className="text-slate-800">{search}</strong>.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-24 lg:px-12">
      {/* Anchor for "All" scroll-spy */}
      <div
        id="category-all"
        data-category-section
        data-category-name="All"
        className="sr-only"
      />

      {grouped.map((group, i) => (
        <div
          key={group.name}
          id={`category-${slugify(group.name)}`}
          data-category-section
          data-category-name={group.name}
          className={i === 0 ? "mt-6" : "mt-10"}
        >
          <h4 className="mb-4 text-base font-semibold tracking-wide text-slate-800">
            {group.name}
          </h4>

          {/* 2 cols mobile → 3 tablet → 4 desktop */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {group.items.map((dish) => (
              <button
                key={dish.id}
                onClick={() => setSelected(dish)}
                className="group flex flex-col rounded-3xl bg-slate-100 p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl active:scale-[0.98]"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={dish.img}
                    alt={dish.name}
                    fill
                    loading="eager"
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      if (
                        !e.currentTarget.src.includes(
                          "/popular-dishes/burger.png"
                        )
                      ) {
                        e.currentTarget.src = "/popular-dishes/burger.png";
                      }
                    }}
                  />
                </div>

                <p className="mt-2 line-clamp-2 text-center text-sm font-semibold text-slate-800">
                  {dish.name}
                </p>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-400 group-hover:bg-slate-100">
                    <Flame size={11} className="text-red-500" />
                    {dish.cal} kcal
                  </span>

                  {dish.hasVariants ? (
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 group-hover:bg-slate-300">
                      Options
                    </span>
                  ) : (
                    <span className="flex items-center text-base font-semibold text-red-600 group-hover:text-red-700">
                      <DirhamIcon
                        size={12}
                        className="mr-0.5 text-red-600 group-hover:text-red-700"
                      />
                      {dish.price}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && screenMode === "mobile" && (
        <ItemDetailModal dish={selected} onClose={() => setSelected(null)} />
      )}
      {selected && screenMode === "tablet" && (
        <TabletItemDetailModal
          dish={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {selected && screenMode === "desktop" && (
        <DesktopItemDetailModal
          dish={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
