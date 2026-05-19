"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  Settings,
  ChevronDown,
  HelpCircle,
  Home,
  ClipboardList,
  User,
  LogOut,
  X,
} from "lucide-react";
import Image from "next/image";

export default function DesktopHeader() {
  const [activeTab, setActiveTab] = useState("home");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const desktopNavItems = [
    { id: "home", label: "Dashboard", icon: <Home size={16} /> },
    { id: "orders", label: "My Orders", icon: <ClipboardList size={16} /> },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-12 shadow-sm select-none transition-all duration-300">
      
      {/* Left Section: Clean Isolated Branding */}
      <div className="flex items-center flex-shrink-0">
        <span className="text-sm font-black uppercase tracking-wider text-slate-900">
          Kabab<span className="text-[#F47B20]">Rayhan</span>
        </span>
      </div>

      {/* Middle Section: Centered Navigation Track & Takeover Search Space */}
      <div className="flex-grow flex justify-center items-center mx-6 max-w-xl transition-all duration-300">
        {!isSearchOpen ? (
          <nav className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100/60 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            {desktopNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-[13px] font-semibold tracking-wide transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-slate-900 text-white shadow-sm scale-100"
                    : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        ) : (
          <div className="relative w-full flex items-center animate-in fade-in slide-in-from-top-1 duration-300">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              autoFocus
              placeholder="Search items, active orders, tickets..."
              className="w-full h-9 pl-10 pr-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-[13px] font-medium text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 focus:border-orange-200 focus:bg-white focus:ring-4 focus:ring-orange-50/60 shadow-inner"
            />
          </div>
        )}
      </div>

      {/* Right Section: Alerts, Search Toggle, & Identity Dropdown */}
      <div className="flex items-center gap-4 flex-shrink-0">
        
        {/* Dynamic Search Toggle Trigger */}
        <button 
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all active:scale-95 duration-200 ${
            isSearchOpen
              ? "border-orange-200 bg-orange-50 text-orange-600 rotate-90"
              : "border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          {isSearchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        {/* Alerts Badge */}
        <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95">
          <Bell size={18} />
          <span className="absolute right-[13px] top-[13px] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Profile Dropdown Component */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-xl border transition-all duration-200 group ${
              isProfileOpen 
                ? "border-orange-200 bg-orange-50/40" 
                : "border-slate-200/80 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-orange-200 bg-slate-100">
              <Image
                src="/profile/profile.jpg"
                alt="Profile"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col text-left hidden lg:flex">
              <h1 className="text-xs font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
                Alexander
              </h1>
              <p className="text-[10px] font-medium text-slate-400 max-w-[120px] truncate">
                Dubai, UAE
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                isProfileOpen ? "rotate-180 text-orange-600" : "group-hover:translate-y-0.5"
              }`}
            />
          </button>

          {/* Collapsible Options Panel Matrix */}
          {isProfileOpen && (
            <div className="absolute right-0 top-[52px] z-50 w-64 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="px-3 py-2.5 mb-1.5 border-b border-slate-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signed in as</p>
                <p className="text-xs font-semibold text-slate-800 truncate">alexander@kababrayhan.com</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">123 Main Street, Dubai</p>
              </div>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                onClick={() => {
                  setActiveTab("profile");
                  setIsProfileOpen(false);
                }}
              >
                <User size={16} className="text-slate-400" />
                <span>Account Profile</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <Settings size={16} className="text-slate-400" />
                <span>System Settings</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <HelpCircle size={16} className="text-slate-400" />
                <span>Help Support</span>
              </button>

              <div className="h-px bg-slate-100 my-1.5" />

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

