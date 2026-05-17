"use client";
import { Heart, Flame } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ItemDetailModal } from "../home/modal/ItemDetailModal";
import { Dish } from "@/app/types/type";
import { useGetItemsQuery } from "../../redux/api";



export default function PopularDishes() {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const { data: items } = useGetItemsQuery();

  const dishes: Dish[] = useMemo(
    () =>
      items?.map((item) => ({
        id: item.item_code || item.name,
        name: item.item_name ?? item.name ?? "Menu Item",
        price: item.standard_rate ? item.standard_rate.toFixed(2) : "0.00",
        cal: "170",
        time: "15-20 min",
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

  return (
    <section className="mt-8">
      <div className="mb-5 flex items-center justify-between px-4">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">
          Popular Dishes
        </h3>
        <button className="text-sm font-semibold text-slate-500 active:opacity-70">
          See all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4">
        {dishes.map((dish) => (
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
                aria-label={dish.liked ? "Remove from favorites" : "Add to favorites"}
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
            {/* BOTTOM SECTION: Calories (Left) and Price (Right) */}
            <div className="mt-3 flex items-center justify-between">
              {/* Calories on the Left */}
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <Flame size={12} className="text-orange-500" />
                <span>{dish.cal} kcal</span>
              </div>

              {/* Price on the Right */}
              <span className="text-[16px] font-semibold text-yellow-400">
                <span className="text-xs font-bold text-yellow-400 mr-0.5">
                  $
                </span>
                {dish.price}
              </span>
            </div>
          </div>
        ))}
      </div>
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

