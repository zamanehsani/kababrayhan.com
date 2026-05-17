import { Search, Settings2 } from "lucide-react";

export default function SearchBar() {
  return (
    <section className="mt-6 flex gap-3 px-4 md:hidden">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search for restaurants or dishes..."
          className="w-full rounded-full border border-slate-100 bg-slate-50 py-3.5 pl-10 pr-4 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-200"
        />
      </div>
      {/* Ensure button has h-12 and w-12 for a clear 48px tap target */}
      <button className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-700 shadow-sm transition-all active:scale-95">
        <Settings2 size={20} />
      </button>
    </section>
  );
}
