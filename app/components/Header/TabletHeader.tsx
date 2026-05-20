"use client";
import {
  Bell,
  Search,
  Settings,
  X,
  Home,
  ClipboardList,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function TabletHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: <Home size={16} /> },
    { id: "orders", label: "Orders", icon: <ClipboardList size={16} /> },
  ];

  return (
    <header className="flex h-24 items-center justify-between px-8 bg-white border-b border-slate-100 transition-all duration-300">
      {/* Left Section: User Profile */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="h-14 w-14 overflow-hidden rounded-full border-2 border-orange-100 shadow-sm block flex-shrink-0"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
          >
            <Image
              src="/profile/profile.jpg"
              alt="Profile"
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </button>

          {isProfileOpen && (
            <div className="absolute left-0 top-[64px] z-20 w-40 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setActiveTab("profile");
                  setIsProfileOpen(false);
                }}
              >
                <User size={16} />
                Profile
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setIsProfileOpen(false)}
              >
                <Settings size={16} />
                Settings
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Typography Collapse: Subtle fade-out to allocate space */}
        <div
          className={`transition-all duration-300 transform origin-left hidden sm:block ${
            isSearchOpen
              ? "max-w-0 opacity-0 scale-95 pointer-events-none"
              : "max-w-[150px] opacity-100"
          }`}
        >
          <p className="text-xs font-normal uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Welcome Back
          </p>
          <h1 className="text-xl font-semibold tracking-wide text-slate-900 whitespace-nowrap">
            Alexander
          </h1>
        </div>
      </div>

      {/* Middle Section: Dynamic Navigation Track / Expansible Search Space */}
      <div className="flex-grow flex justify-center mx-4 max-w-xl transition-all duration-300">
        {!isSearchOpen ? (
          <nav className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-100 animate-in fade-in duration-300">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  activeTab === item.id
                    ? "bg-yellow-400 text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        ) : (
          /* Input Container expands inside the flex-grow area gracefully */
          <div className="relative w-full flex items-center pl-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Search
              size={18}
              className="absolute left-8 text-slate-400 pointer-events-none z-10"
            />
            <input
              type="text"
              autoFocus
              placeholder="Search dishes, orders, tags..."
              className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-50 shadow-inner"
            />
          </div>
        )}
      </div>

      {/* Right Section: Utility Tools Matrix */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all active:scale-95 ${
            isSearchOpen
              ? "border-slate-200 bg-slate-50 text-slate-600 rotate-90"
              : "border-slate-100 bg-slate-50 text-slate-600"
          } duration-300`}
        >
          {isSearchOpen ? <X size={20} /> : <Search size={20} />}
        </button>

        <button className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition-all active:scale-95">
          <Bell size={22} />
          <span className="absolute right-[13px] top-[13px] h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
        </button>
      </div>
    </header>
  );
}

