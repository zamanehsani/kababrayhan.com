import { Home, ShoppingCart, ClipboardList, User } from "lucide-react";

export default function BottomNav() {
  const navItems = [
    { id: 'home', icon: <Home size={18} />, active: true }, // Reduced from 22 to 18
    { id: 'cart', icon: <ShoppingCart size={18} />, active: false },
    { id: 'orders', icon: <ClipboardList size={18} />, active: false },
    { id: 'profile', icon: <User size={18} />, active: false },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* Reduced padding from p-2 to p-1.5, and gap from gap-2 to gap-1.5 */}
      <div className="flex items-center gap-1.5 rounded-full bg-slate-400/20 p-1.5 backdrop-blur-xl border border-white/20 shadow-xl">
        {navItems.map((item) => (
          <button
            key={item.id}
        
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${
              item.active
              ? "bg-yellow-400 text-slate-900 shadow-sm scale-105" // Lowered scale from 110 to 105
              : "bg-white text-slate-500 hover:bg-slate-50 active:scale-95 shadow-sm"
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </nav>
  );
}
