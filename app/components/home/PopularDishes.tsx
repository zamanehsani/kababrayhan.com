import DesktopPopularDishes from "../PopularDishes.tsx/DesktopPopularDishes";
import MobilePopularDishes from "../PopularDishes.tsx/MobilePopularDishes";
import TabletPopularDishes from "../PopularDishes.tsx/TabletPopularDishes";

export default function PopularDishes() {
  return (
    <>
      {/* 1. Mobile Interface: Handles viewports below 768px */}
      <div className="block md:hidden">
        <MobilePopularDishes />
      </div>

      {/* 2. Tablet Interface: Handles viewports from 768px up to 1023px */}
      <div className="hidden md:block lg:hidden">
        <TabletPopularDishes />
      </div>

      {/* 3. Laptop & Desktop Interface: Handles viewports 1024px and up */}
      <div className="hidden lg:block">
        <DesktopPopularDishes />
      </div>
    </>
  );
}
