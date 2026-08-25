import { Suspense } from "react";
import { fetchMenuItems, fetchItemGroups } from "./lib/erp";
import CategoryBar from "./components/menu/CategoryBar";
import ItemsGrid from "./components/menu/ItemsGrid";
import SearchBar from "./components/home/SearchBar";
import BottomNav from "./components/home/BottomNav";

export default async function Home() {
  const [items, groups] = await Promise.all([
    fetchMenuItems().catch(() => []),
    fetchItemGroups().catch(() => []),
  ]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SearchBar />
      <CategoryBar groups={groups} />
      {/* Suspense boundary required because ItemsGrid reads useSearchParams */}
      <Suspense>
        <ItemsGrid items={items} groups={groups} />
      </Suspense>
      <BottomNav />
      <ScreenIndicator />
    </main>
  );
}

export function ScreenIndicator() {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-8 items-center justify-center rounded-full bg-slate-900 px-3 font-mono text-xs font-bold text-white shadow-lg">
      <span className="block sm:hidden">📱 Mobile (&lt;640px)</span>
      <span className="hidden sm:block md:hidden">
        📱 Large Mobile / Mini Tablet (640px-767px)
      </span>
      <span className="hidden md:block lg:hidden">
        📟 Tablet (768px-1023px)
      </span>
      <span className="hidden lg:block xl:hidden">
        💻 Laptop (1024px-1279px)
      </span>
      <span className="hidden xl:block 2xl:hidden">
        🖥️ Desktop (1280px-1535px)
      </span>
      <span className="hidden 2xl:block">
        📺 Extra Large Screen (&gt;1536px)
      </span>
    </div>
  );
}
