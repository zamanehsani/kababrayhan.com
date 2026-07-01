"use client";
import React from "react";
import logoImg from "../../../../../public/logo.png";
import Image from "next/image";

interface GlobalLoaderProps {
  message?: string;
}

export default function GlobalLoader({ message = "Preparing your order..." }: GlobalLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden bg-stone-950/40 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Premium ambient branding glow anchors */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[50vw] w-[50vw] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      {/* Main architectural card module */}
      <div className="relative flex flex-col items-center px-8 py-10 rounded-3xl bg-white/80 border border-white/40 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.15)] backdrop-blur-2xl max-w-xs w-full text-center scale-up-in duration-300">
        
        {/* Continuous ambient tracking ring around logo */}
        <div className="absolute top-8 w-28 h-28 rounded-full border border-dashed border-red-600/20 animate-[spin_20s_linear_infinite]" />

        {/* Animated Brand Identity Container */}
        <div className="w-24 h-24 relative transform animate-[pulse_2.5s_ease-in-out_infinite] hover:scale-105 transition-transform duration-300 z-10">
          <Image
            src={logoImg} 
            alt="Pizza.ae Premium Logo"
            fill
            sizes="96px"
            priority
            className="object-contain drop-shadow-[0_4px_12px_rgba(220,38,38,0.08)]"
          />
        </div>

        {/* Custom Progress Engine Indication Layout */}
        <div className="flex flex-col items-center gap-4 mt-8 w-full z-10">
          
          {/* Elite Micro-Spinner Tracker */}
          <div className="relative h-5 w-5">
            {/* Structural base track */}
            <div className="absolute inset-0 rounded-full border-[2.5px] border-stone-100" />
            {/* Accelerated active momentum driver */}
            <div className="absolute inset-0 animate-spin rounded-full border-[2.5px] border-red-600 border-t-transparent [animation-duration:0.65s]" />
          </div>
          
          {/* Luxury Minimalist Interface Typography */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-800 antialiased">
              {message}
            </p>
            <p className="text-[9px] font-medium tracking-widest text-stone-400 uppercase opacity-80">
              Please wait
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
