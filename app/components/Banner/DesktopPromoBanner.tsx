import Image from "next/image";

export default function DesktopPromoBanner() {
  return (
    /* 
      The Fix: 
      - px-12 ensures that between 1024px and 1279px (Laptop mode), the content doesn't hit the screen edges.
      - max-w-[1440px] (or max-w-7xl if you prefer 1280px) safely locks the width on higher tiers.
      - mx-auto centers everything smoothly when the screen exceeds the max width.
    */
    <section className="mt-10 max-w-[1440px] mx-auto px-12">
      <div className="relative rounded-[32px] bg-yellow-400 p-12 text-white shadow-xl shadow-orange-100/30 min-h-[280px] flex items-center">
        
        {/* Left text grid layout column */}
        <div className="relative z-10 max-w-[55%] flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-2xl font-semibold text-white w-fit tracking-wide">
            Limited Time Sale
          </div>
          
          {/* Kept text-4xl clean for laptop screen layouts, safely scaling to 5xl on desktop grids */}
          <h2 className="mt-2 text-4xl font-semibold leading-tight tracking-wide text-white xl:text-5xl">
            Hot Deal of the Month
          </h2>
          
          <p className="mt-2 text-base font-medium text-white max-w-sm tracking-wide">
            Discover exclusive weekly reductions on top-rated dishes and
            restaurants near you.
          </p>
          
          <button className="mt-6 w-fit rounded-full bg-white px-8 py-3 text-base font-semibold tracking-wide text-slate-900 shadow-md transition-all hover:bg-slate-50 hover:shadow-lg active:scale-95">
            Shop Now
          </button>
        </div>

        {/* Right side large graphic illustration frame */}
        <div className="absolute right-2 bottom-0 w-80 h-80 xl:w-96 xl:h-96 z-20 transition-transform duration-500 hover:scale-105">
          <Image
            src="/banner/banner.PNG"
            alt="Promotion"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>
    </section>
  );
  
}
