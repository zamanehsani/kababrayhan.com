"use client";
import React, { useState } from "react";
import {
  Bell,
  Search,
  Settings,
  ChevronDown,
  HelpCircle,
  Home,
  ClipboardList,
  User,
} from "lucide-react";
import Image from "next/image";

export default function DesktopHeader() {
  const [activeTab, setActiveTab] = useState("home");

  const desktopNavItems = [
    { id: "home", label: "Dashboard", icon: <Home size={16} /> },
    { id: "orders", label: "My Orders", icon: <ClipboardList size={16} /> },
    { id: "profile", label: "Account Profile", icon: <User size={16} /> },
  ];

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-12 shadow-sm">
      {/* Left Section: User Identity Row */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-orange-100 shadow-sm">
          <Image
            src="/profile/profile.jpg"
            alt="Profile"
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 cursor-pointer group">
            <h1 className="text-base font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
              Alexander
            </h1>
            <ChevronDown
              size={14}
              className="text-slate-400 group-hover:text-slate-600 transition-transform duration-200 group-hover:translate-y-0.5"
            />
          </div>
          <p className="text-[11px] font-medium text-slate-400">
            123 Main Street, New York
          </p>
        </div>
      </div>

      {/* Middle-Left Section: Integrated Desktop Navigation Tabs */}
      <nav className="flex items-center gap-1 ml-8 mr-auto">
        {desktopNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold tracking-wide transition-all ${
              activeTab === item.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Middle Section: Modern Structured Search Field */}
      <div className="relative w-full max-w-xs mx-6">
        <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Search items or recipes..."
          className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-orange-200 focus:bg-white focus:ring-4 focus:ring-orange-50"
        />
      </div>

      {/* Right Section: System Action Utilities */}
      <div className="flex items-center gap-3">
        <button className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
          <HelpCircle size={20} />
        </button>

        <button className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
          <Settings size={20} />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
          <Bell size={20} />
          <span className="absolute right-[12px] top-[12px] h-2 w-2 rounded-full bg-red-500"></span>
        </button>
      </div>
    </header>
  );
}

// import { Bell, Search, Settings, ChevronDown, HelpCircle } from "lucide-react";
// import Image from "next/image";

// export default function DesktopHeader() {
//   return (
//     <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-12 shadow-sm">
//       {/* Left Section: User Profile Context & Main Identification */}
//       <div className="flex items-center gap-4">
//         {/* Profile Image - Optimized at 48px for flat dashboard rows */}
//         <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-orange-100 shadow-sm">
//           <Image
//             src="/profile/profile.jpg"
//             alt="Profile"
//             width={48}
//             height={48}
//             className="h-full w-full object-cover"
//           />
//         </div>

//         <div className="flex flex-col">
//           <div className="flex items-center gap-1.5 cursor-pointer group">
//             <h1 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
//               Alexander
//             </h1>
//             <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-transform duration-200 group-hover:translate-y-0.5" />
//           </div>
//           <p className="text-xs font-medium text-slate-400">
//             123 Main Street, New York
//           </p>
//         </div>
//       </div>

//       {/* Middle Section: Integrated Wide-Screen Search Input Bar */}
//       <div className="relative w-full max-w-md mx-8">
//         <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none">
//           <Search size={18} />
//         </span>
//         <input
//           type="text"
//           placeholder="Search transactions, documentation, settings..."
//           className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-orange-200 focus:bg-white focus:ring-4 focus:ring-orange-50"
//         />
//       </div>

//       {/* Right Section: Enterprise Desktop Utility Actions */}
//       <div className="flex items-center gap-4">
//         {/* Help / Support Utility Icon */}
//         <button className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
//           <HelpCircle size={22} />
//         </button>

//         {/* Global Settings Shortcut */}
//         <button className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
//           <Settings size={22} />
//         </button>

//         {/* Vertical Divider Separating Settings from Main Alert Center */}
//         <div className="h-6 w-px bg-slate-200" />

//         {/* Main Notification Trigger */}
//         <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-95">
//           <Bell size={22} />
//           {/* Notification Badge - Repositioned for standard desktop grid alerts */}
//           <span className="absolute right-[11px] top-[11px] h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
//         </button>
//       </div>
//     </header>
//   );
// }
