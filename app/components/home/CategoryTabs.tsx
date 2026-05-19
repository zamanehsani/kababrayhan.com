"use client";

import DesktopCategoryTabs from "../CategoryTabs.tsx/DesktopCategoryTabs";
import MobileCategoryTabs from "../CategoryTabs.tsx/MobileCategoryTabs";
import TabletCategoryTabs from "../CategoryTabs.tsx/TabletCategoryTabs";
import { useScreenMode } from "../../lib/useScreenMode";


export default function CategoryTabs() {
  const screenMode = useScreenMode();

  if (screenMode === "mobile") {
    return <MobileCategoryTabs />;
  }

  if (screenMode === "tablet") {
    return <TabletCategoryTabs />;
  }

  if (screenMode === "desktop") {
    return <DesktopCategoryTabs />;
  }

  return null;
}
