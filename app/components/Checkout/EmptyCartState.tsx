import React from "react";
import { Link } from "react-router-dom";

const EmptyCartState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      {/* Visual Element: Minimalist Shopping Bag with Brand Accent */}
      <div className="relative mb-8 flex h-36 w-36 items-center justify-center rounded-full bg-stone-50">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1} 
          stroke="currentColor" 
          className="h-16 w-16 text-stone-300"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.112 11.523a1.125 1.125 0 0 1-1.097 1.232H4.239a1.125 1.125 0 0 1-1.097-1.232l1.112-11.523a1.125 1.125 0 0 1 1.097-1.071h14.5c.315 0 .611.133.817.367Z" />
        </svg>
        
        {/* Playful Brand Pulse Dot */}
        <div className="absolute top-10 right-10 h-3.5 w-3.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
      </div>

      {/* Text Content */}
      <div className="max-w-xs">
        <h3 className="text-2xl font-black tracking-tight text-stone-900">
          Your plate is empty
        </h3>
        <p className="mt-3 text-sm font-medium leading-relaxed text-stone-500/80">
          Looks like you haven't added any delicious pizzas yet. Let's fix that.
        </p>
      </div>

      {/* Call to Action: Brand Red Button */}
      <Link
        to="/menu"
        className="mt-10 inline-flex items-center justify-center rounded-[1.5rem] bg-red-600 px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-red-100 transition-all hover:bg-red-700 hover:shadow-red-200 hover:-translate-y-0.5 active:scale-95"
      >
        Browse Menu
      </Link>

      <Link 
        to="/" 
        className="mt-6 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-red-600 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default EmptyCartState;