"use client";

import DesktopPopularDishes from "../PopularDishes.tsx/DesktopPopularDishes";
import MobilePopularDishes from "../PopularDishes.tsx/MobilePopularDishes";
import TabletPopularDishes from "../PopularDishes.tsx/TabletPopularDishes";
import { useScreenMode } from "../../lib/useScreenMode";

export default function PopularDishes() {
  const screenMode = useScreenMode();

  if (screenMode === "mobile") {
    return <MobilePopularDishes />;
  }

  if (screenMode === "tablet") {
    return <TabletPopularDishes />;
  }

  if (screenMode === "desktop") {
    return <DesktopPopularDishes />;
  }

  return null;
}
