import SearchBar from "./components/home/SearchBar";
import PromoBanner from "./components/home/PromoBanner";
import CategoryTabs from "./components/home/CategoryTabs";
import PopularDishes from "./components/home/PopularDishes";
import BottomNav from "./components/home/BottomNav";
import MobileHeader from "./components/Header/MobileHeader";
import TabletHeader from "./components/Header/TabletHeader";
import DesktopHeader from "./components/Header/DesktopHeader";
import CartSidebarWidget from "./components/Cart/CartSidebarWidget";
import Footer from "./components/Footer/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* 1. Mobile Header: Visible by default, hidden from tablet (md) upwards */}
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      {/* 2. Tablet Header: Hidden by default, visible only on tablet dimensions (md to lg) */}
      <div className="hidden md:block lg:hidden">
        <TabletHeader />
      </div>

      <div className="hidden lg:block">
        <DesktopHeader />
      </div>

      {/* <Header /> */}
      <SearchBar />
      {/* <PromoBanner /> */}
      <CategoryTabs />
      <PopularDishes />

      {/* Footer */}
      <Footer />

      {/* Floating Navigation */}
      <BottomNav />

      {/* Isolated Interactive Cart Layer */}
      <CartSidebarWidget />
      {/* Persistent Developer Tool */}
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
