"use client";
import { Flame, Heart } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dish } from "@/app/types/type";
import { ERP_API_BASE_URL, useGetItemsQuery } from "../../redux/api";
import { DesktopItemDetailModal } from "../home/modal/DesktopItemDetailModal";

export default function DesktopPopularDishes() {
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
        .filter((item) => !item.variant_of)
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
      Unified layout constraints for Laptop, Desktop, and Ultra-wide tiers:
      - px-12 ensures clean padding on laptop viewports (1024px - 1279px) so elements don't hit the screen edge
      - max-w-[1440px] establishes the wide alignment ceiling across the home page
      - mx-auto centers the section block perfectly on screens beyond 1440px
    */
    <section className="mt-8 max-w-[1440px] mx-auto px-12">
      {/* HEADER SECTION */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-semibold tracking-wide text-slate-900">
          Popular Dishes
        </h3>
        {/* <button className="text-sm font-semibold tracking-wide text-slate-500 hover:text-slate-800 transition-colors active:opacity-70">
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
        <div className="rounded-3xl border border-slate-100 bg-slate-50/70 px-6 py-16 text-center">
          <p className="text-base font-medium text-slate-700">
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
            className={index === 0 ? "" : "mt-10"}
          >
            <div className="mb-4">
              <h4 className="text-base font-semibold tracking-wide text-slate-800">
                {group.name}
              </h4>
            </div>

            {/* 
            High-Density Grid Layout:
            - Perfectly suited for desktop views, keeping cards beautifully proportioned
          */}
            <div className="grid grid-cols-4 gap-6">
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
                  className="group relative flex flex-col rounded-[2rem] bg-slate-100 p-4 border border-slate-100/50 transition-all duration-300 ease-out hover:bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 active:scale-[0.98]"
                >
                  {/* TOP SECTION: Title and Wishlist */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-[16px] font-semibold leading-snug tracking-wide text-slate-800 line-clamp-2 group-hover:text-slate-900 transition-colors">
                      {dish.name}
                    </h4>
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition-all duration-200 hover:scale-110 active:scale-90"
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

                  {/* MIDDLE SECTION: Image centered with a soft hover scale effect */}
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
                      className="object-contain p-0 transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* BOTTOM SECTION: Calories and Price */}
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    {/* Calories (Left) */}
                    <div className="flex items-center gap-1 text-xs font-semibold tracking-wide text-slate-400 bg-slate-100/80 group-hover:bg-slate-50 px-2 py-0.5 rounded-full transition-colors">
                      <Flame size={12} className="text-orange-500" />
                      <span>{dish.cal} kcal</span>
                    </div>

                    {/* Price (Right) */}
                    <span className="text-[18px] font-semibold tracking-wide text-emerald-600 group-hover:text-emerald-700 transition-colors">
                      <span className="text-xs font-bold mr-0.5">AED</span>
                      {dish.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ITEM DETAIL MODAL */}
      {selectedDish && (
        <DesktopItemDetailModal
          dish={selectedDish}
          onClose={() => setSelectedDish(null)}
        />
      )}
    </section>
  );
}
