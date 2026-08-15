"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function SearchBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchValue = searchParams.get("search") ?? "";
  const [draftSearchValue, setDraftSearchValue] = useState(searchValue);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupDebounce = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  };

  const applySearchQuery = (nextValue: string) => {
    const cleanValue = nextValue.trim();
    const nextParams = new URLSearchParams(searchParams.toString());

    if (cleanValue.length >= 2) {
      nextParams.set("search", cleanValue);
    } else {
      nextParams.delete("search");
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const updateSearchQuery = (nextValue: string) => {
    const trimmedValue = nextValue;
    setDraftSearchValue(trimmedValue);

    cleanupDebounce();

    if (!trimmedValue.trim()) {
      searchDebounceRef.current = setTimeout(() => applySearchQuery(""), 350);
      return;
    }

    if (trimmedValue.trim().length < 2) {
      return;
    }

    searchDebounceRef.current = setTimeout(
      () => applySearchQuery(trimmedValue),
      400
    );
  };

  return (
    <section className="mt-6 flex gap-3 px-4 md:hidden">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search for dishes and more"
          value={draftSearchValue}
          onChange={(event) => updateSearchQuery(event.target.value)}
          className="w-full rounded-full border border-slate-100 bg-slate-50 py-3 pl-10 pr-4 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>
    </section>
  );
}
