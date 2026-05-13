import Header from "./components/home/Header";
import SearchBar from "./components/home/SearchBar";
import PromoBanner from "./components/home/PromoBanner";
import CategoryTabs from "./components/home/CategoryTabs";
import PopularDishes from "./components/home/PopularDishes";
import BottomNav from "./components/home/BottomNav";

export default function Home() {
  return (
    <main className="min-h-screen bg-white pb-32 font-sans text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header />
      <SearchBar />
      <PromoBanner />
      <CategoryTabs />
      <PopularDishes />

      {/* Floating Navigation */}
      <BottomNav />
    </main>
  );
}
