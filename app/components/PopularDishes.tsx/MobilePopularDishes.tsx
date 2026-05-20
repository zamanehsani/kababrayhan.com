"use client";
import { Heart, Flame } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ItemDetailModal } from "../home/modal/ItemDetailModal";
import { Dish } from "@/app/types/type";
import { useGetItemsQuery } from "../../redux/api";



export default function PopularDishes() {
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

  const dishes: Dish[] = useMemo(
    () =>
      items?.map((item) => ({
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
        img: item.image || "/popular-dishes/burger.png",
        liked: false,
      })) ?? [],
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
    <section className="mt-8">
      <div className="mb-5 flex items-center justify-between px-4">
        <h3 className="text-xl font-normal tracking-wide text-slate-900">
          Popular Dishes
        </h3>
        <button className="text-sm font-normal text-slate-500 active:opacity-70">
          See all
        </button>
      </div>

      <div
        id="category-all"
        data-category-section
        data-category-name="All"
        className="sr-only"
      />

      {groupedDishes.length === 0 ? (
        <div className="px-4 py-12 text-center">
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
            className={index === 0 ? "" : "mt-6"}
          >
            <div className="mb-3 px-4">
              <h4 className="text-sm font-semibold tracking-wide text-slate-800">
                {group.name}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 px-4">
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
                  className="relative flex flex-col rounded-[2rem] bg-slate-50 p-4 transition-all active:scale-[0.98]"
                >
                  {/* TOP SECTION: Title and Wishlist */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-[14px] font-semibold leading-tight text-slate-800 line-clamp-2">
                      {dish.name}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition-colors active:scale-90"
                      aria-label={
                        dish.liked ? "Remove from favorites" : "Add to favorites"
                      }
                    >
                      <Heart
                        size={14}
                        fill={dish.liked ? "currentColor" : "none"}
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>

                  {/* MIDDLE SECTION: Image centered on the gray card */}
                  <div className="relative aspect-square w-full">
                    <Image
                      src={dish.img}
                      alt={dish.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  {/* BOTTOM SECTION: Calories and Price */}
                  <div className="mt-3 flex items-center justify-between">
                    {/* Calories on the Left */}
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <Flame size={12} className="text-orange-500" />
                      <span>{dish.cal} kcal</span>
                    </div>

                    {/* Price on the Right */}
                    <span className="text-[16px] font-semibold text-yellow-400">
                      <span className="text-xs font-bold text-yellow-400 mr-0.5">
                        AED
                      </span>
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
        <ItemDetailModal
          dish={selectedDish}
          onClose={() => setSelectedDish(null)}
        />
      )}
    </section>
  );
}

