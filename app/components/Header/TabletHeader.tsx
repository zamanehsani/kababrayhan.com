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
    <header className="flex items-center justify-between px-8 pt-8 bg-white border-b border-slate-100 pb-4">
      {/* Left Section: User Profile & Details */}
      <div className="flex items-center gap-4 min-w-50">
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="h-14 w-14 overflow-hidden rounded-full border-2 border-orange-100 shadow-sm"
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
            <div className="absolute left-0 top-[68px] z-20 w-40 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
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
        <div>
          <p className="text-xs font-normal uppercase tracking-wider text-slate-400">
            Welcome Back
          </p>
          <h1 className="text-xl font-semibold tracking-wide text-slate-900">
            Alexander
          </h1>
        </div>
      </div>

      {/* Middle Section: Clean Inline Navigation Track */}
      <nav className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-100 mx-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
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

      {/* Right Section: Utility Tools Matrix */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-end">
          <input
            type="text"
            placeholder="Search..."
            className={`h-12 rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 ease-in-out focus:border-orange-200 focus:bg-white focus:ring-4 focus:ring-orange-50 ${
              isSearchOpen
                ? "w-[220px] opacity-100 mr-2"
                : "w-0 opacity-0 pointer-events-none border-transparent bg-transparent"
            }`}
          />
          {isSearchOpen && (
            <Search size={18} className="absolute left-4 text-slate-400" />
          )}

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border transition-all active:scale-95 z-10 ${
              isSearchOpen
                ? "border-orange-200 bg-orange-50 text-orange-600"
                : "border-slate-100 bg-slate-50 text-slate-600"
            }`}
          >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>

        <button className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition-all active:scale-95">
          <Bell size={24} />
          <span className="absolute right-[12px] top-[12px] h-3 w-3 rounded-full border-2 border-white bg-red-500"></span>
        </button>
      </div>
    </header>
  );
}

// "use client";
// import { Bell, Search, Settings, Settings2, X } from "lucide-react";
// import Image from "next/image";
// import { useState } from "react";

// export default function TabletHeader() {
//   const [isSearchOpen, setIsSearchOpen] = useState(false);

//   return (
//     <header className="flex items-center justify-between px-8 pt-8 bg-white border-b border-slate-100 pb-4">
//       {/* Left Section: User Profile & Details */}
//       <div className="flex items-center gap-4">
//         {/* Profile Image - Scaled up to 56px for tablet viewports */}
//         <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-orange-100 shadow-sm flex-shrink-0">
//           <Image
//             src="/profile/profile.jpg"
//             alt="Profile"
//             width={56}
//             height={56}
//             className="h-full w-full object-cover"
//           />
//         </div>

//         <div>
//           {/* Subtitle placed above name for a cleaner dashboard aesthetic */}
//           <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
//             Welcome Back
//           </p>
//           <h1 className="text-xl font-bold tracking-tight text-slate-900">
//             Alexander
//           </h1>
//           <p className="text-sm font-medium text-slate-500 mt-0.5">
//             123 Main Street, New York
//           </p>
//         </div>
//       </div>

//       <div className="flex items-center gap-3">

//         {/* Dynamic Search Wrapper: Expands gracefully from right to left */}
//         <div className="relative flex items-center justify-end">
//           <input
//             type="text"
//             autoFocus
//             placeholder="Search for restaurants or dishes..."
//             className={`h-12 rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 ease-in-out focus:border-orange-200 focus:bg-white focus:ring-4 focus:ring-orange-50 ${
//               isSearchOpen
//                 ? "w-[280px] opacity-100 mr-2"
//                 : "w-0 opacity-0 pointer-events-none border-transparent bg-transparent"
//             }`}
//           />
//           {/* Search Icon placed over the sliding input field when active */}
//           {isSearchOpen && (
//             <Search
//               size={18}
//               className="absolute left-4 text-slate-400 animate-in fade-in duration-300"
//             />
//           )}

//           {/* Trigger Toggle Button */}
//           <button
//             onClick={() => setIsSearchOpen(!isSearchOpen)}
//             className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border transition-all active:scale-95 z-10 ${
//               isSearchOpen
//                 ? "border-orange-200 bg-orange-50 text-orange-600"
//                 : "border-slate-100 bg-slate-50 text-slate-600"
//             }`}
//           >
//             {isSearchOpen ? <X size={20} /> : <Search size={20} />}
//           </button>
//         </div>

//         {/* Settings Shortcut */}
//         <button className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-600 transition-all active:scale-95">
//           <Settings size={20} />
//         </button>

//         {/* Primary Notification Action */}
//         <button className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition-all active:scale-95">
//           <Bell size={24} />
//           <span className="absolute right-[12px] top-[12px] h-3 w-3 rounded-full border-2 border-white bg-red-500"></span>
//         </button>
//       </div>
//     </header>
//   );
// }
