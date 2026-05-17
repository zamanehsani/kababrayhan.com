import Image from "next/image";

export default function TabletPromoBanner() {
 return (
    /* 
      Tablet Mode UI Constraint (768px - 1023px):
      - Keeps the unified mt-10 and px-8 padding of your tablet layout system
    */
    <section className="mt-10 px-8">
      <div className="relative overflow-visible rounded-[32px] bg-yellow-400 p-10 text-white shadow-xl shadow-orange-100/30 min-h-[240px] flex items-center justify-between">
        
        {/* Left Side: Content Wrapper */}
        <div className="relative z-10 max-w-[55%] flex flex-col justify-center">
          <span className="text-sm font-semibold tracking-wide text-white opacity-95">
            Get 50% off Today!
          </span>
          
          <h2 className="mt-1.5 text-3xl font-semibold leading-tight tracking-wide text-white">
            Hot Deal of the Month
          </h2>
          
          <button className="mt-5 w-fit rounded-full bg-white px-6 py-2.5 text-sm font-semibold tracking-wide text-slate-900 shadow-md transition-all active:scale-95">
            Shop Now
          </button>
        </div>

        {/* Right Side: Graphic Frame
            Tailored to handle standard tablet heights with a clean overflow layout 
        */}
        <div className="absolute right-4 bottom-0 w-72 h-72 z-20">
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
