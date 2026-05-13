import { Bell } from "lucide-react";
import Image from "next/image";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 pt-6">
      <div className="flex items-center gap-3">
        {/* Profile Image - Kept at 48px, perfect for mobile */}
        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-orange-100 shadow-sm">
          <Image
            src="/profile/profile.jpg"
            alt="Profile"
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          {/* Increased weight for better recognition */}
          <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
            Alexander
          </h1>
          {/* Bumped to text-sm (14px) for readability; slate-500 is the standard for secondary info */}
          <p className="text-sm font-medium text-slate-500">
            123 Main Street, New York
          </p>
        </div>
      </div>

      {/* Increased padding (p-2.5) for a better thumb tap target */}
      <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition-all active:scale-90">
        <Bell size={22} />
        {/* Notification Dot - positioned slightly better for visibility */}
        <span className="absolute right-[10px] top-[10px] h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
      </button>
    </header>
  );
}
