"use client";

import Image from "next/image";
import Link from "next/link";

export default function MobileHeader() {
  return (
    <header className="flex h-20 items-center justify-center border-b border-slate-100 bg-white px-4 py-3">
      <Link href="/home" className="flex items-center justify-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full">
          <Image
            src="/logo.png"
            alt="Kabab Al Rayhan"
            width={50}
            height={50}
            className="h-full w-full object-contain p-1"
            priority
          />
        </div>

        <div className="min-w-0 text-center">
          <h1 className="truncate text-lg font-bold text-slate-900">
            Kabab Al Rayhan
          </h1>
          <p className="truncate text-sm font-medium uppercase text-slate-500">
            Restaurant & Bakery
          </p>
        </div>
      </Link>
    </header>
  );
}
