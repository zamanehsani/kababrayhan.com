"use client";
import { Heart, Flame } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dish } from "@/app/types/type";
import { TabletItemDetailModal } from "../home/modal/TabletItemDetailModal";
import { ERP_API_BASE_URL, useGetItemsQuery } from "../../redux/api";
import DirhamIcon from "../icon/DirhamIcon";


export default function TabletPopularDishes() {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const { data: items } = useGetItemsQuery();
  const searchParams = useSearchParams();
  const searchValue = searchParams.get("search") ?? "";
  const normalizedSearchValue = searchValue.trim().toLowerCase();

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const resolveDishImage = (value?: string) => {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      return "/popular-dishes/burger.png";
    }

    if (/^https?:\/\//i.test(normalizedValue)) {
      return normalizedValue;
    }

    return `${ERP_API_BASE_URL}${
      normalizedValue.startsWith("/") ? normalizedValue : `/${normalizedValue}`
    }`;
  };

  const dishes: Dish[] = useMemo(
    () =>
      (items ?? [])
        .filter((item) => !item.variant_of && item.disabled !== 1)
        .map((item) => ({
        id: item.item_code || item.name,
        name: item.item_name ?? item.name ?? "Menu Item",
        price: item.standard_rate ? item.standard_rate.toFixed(2) : "0.00",
        cal: item.custom_calories ? item.custom_calories.toString() : "170",
        time: item.custom_prep_time ? `${item.custom_prep_time} min` : "15-20 min",
        rating: "4.7",
        restaurant: item.item_group ?? "Popular",
        tags: item.item_group
          ? `${item.item_group} • Popular`
          : "Chef's Choice • Popular",
        description:
          item.description ??
          "A delicious selection from our menu, prepared fresh for you.",
        img: resolveDishImage(item.image),
        liked: false,
        hasVariants:
          typeof item.has_variants === "number"
            ? item.has_variants === 1
            : Boolean(item.has_variants),
      })),
    [items]
  );

  const groupedDishes = (() => {
    const groups = new Map<string, Dish[]>();

    const sourceDishes = normalizedSearchValue
      ? dishes.filter((dish) =>
          [dish.name, dish.restaurant, dish.tags, dish.description]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearchValue)
        )
      : dishes;

    sourceDishes.forEach((dish) => {
      const groupName = dish.restaurant || "Popular";
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)?.push(dish);
    });

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, items]) => ({ name, items }));
  })();

  return (
    /* 
      Tablet Mode (768px - 1023px) 
      - Fixed padding of px-8 works perfectly within this viewport range
    */
    <section className="mt-10 px-8">
      {/* Header Layout */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-semibold tracking-wide text-slate-900">
          Popular Dishes
        </h3>
        {/* <button className="text-sm font-semibold text-slate-500 active:opacity-70 tracking-wide">
          See all
        </button> */}
      </div>

      <div
        id="category-all"
        data-category-section
        data-category-name="All"
        className="sr-only"
      />

      {groupedDishes.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-slate-50/70 px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-700">
            No dishes found for{" "}
            <span className="font-semibold text-slate-900">{searchValue.trim()}</span>.
          </p>
        </div>
      ) : (
        groupedDishes.map((group, index) => (
          <div
            key={group.name}
            id={`category-${slugify(group.name)}`}
            data-category-section
            data-category-name={group.name}
            className={index === 0 ? "" : "mt-8"}
          >
            <div className="mb-4">
              <h4 className="text-base font-semibold tracking-wide text-slate-800">
                {group.name}
              </h4>
            </div>

            {/* 3-Column Grid optimized for Tablet widths */}
            <div className="grid grid-cols-3 gap-5">
              {group.items.map((dish) => (
                <div
                  key={dish.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDish(dish)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDish(dish);
                    }
                  }}
                  className="group relative flex flex-col rounded-[2rem] bg-slate-100 p-3 border border-slate-100/40 transition-all duration-200 hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 active:scale-[0.98]"
                >
                  {/* TOP SECTION: Title and Wishlist */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-[15px] font-semibold leading-snug text-slate-800 line-clamp-2 transition-colors group-hover:text-slate-900">
                      {dish.name}
                    </h4>
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition-transform active:scale-90"
                      aria-label={
                        dish.liked ? "Remove from favorites" : "Add to favorites"
                      }
                    >
                      <Heart
                        size={15}
                        fill={dish.liked ? "currentColor" : "none"}
                        strokeWidth={2.5}
                      />
                    </button> */}
                  </div>

                  {/* MIDDLE SECTION: Image box with subtle zoom feedback */}
                  <div className="relative aspect-square w-full my-1 overflow-hidden">
                    <Image
                      src={dish.img}
                      alt={dish.name}
                      fill
                      onError={(event) => {
                        if (!event.currentTarget.src.includes("/popular-dishes/burger.png")) {
                          event.currentTarget.src = "/popular-dishes/burger.png";
                        }
                      }}
                      className="object-contain p-0 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* BOTTOM SECTION: Calories (Left) and Price (Right) */}
                  <div className="mt-auto pt-1 flex items-center justify-between">
                    {/* Calories */}
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100/70 group-hover:bg-slate-50 px-2 py-0.5 rounded-full transition-colors">
                      <Flame size={12} className="text-orange-500" />
                      <span>{dish.cal} kcal</span>
                    </div>

                    {/* Price */}
                    {dish.hasVariants ? (
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 bg-slate-200 group-hover:bg-slate-300 px-2.5 py-1 rounded-full transition-colors">
                        Options
                      </span>
                    ) : (
                      <span className="flex items-center text-[17px] font-bold text-emerald-600 transition-colors group-hover:text-emerald-700">
                        <DirhamIcon size={13} className="mr-0.5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                        {dish.price}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ITEM DETAIL MODAL */}
      {selectedDish && (
        <TabletItemDetailModal
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)} 
        />
      )}
    </section>
  );
}
