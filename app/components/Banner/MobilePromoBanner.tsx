import Image from "next/image";

export default function PromoBanner() {
  return (
    <section className="mt-6 px-4">
      <div className="relative  rounded-3xl bg-red-600 p-6 text-white shadow-lg shadow-red-100/40">
        <div className="relative z-10 max-w-[65%]">
          {/* Using medium/semibold instead of bold for a cleaner look */}
          <span className="text-xs font-sans  tracking-wide text-white-900">
            Get 50% off Today!
          </span>

          {/* Changed from font-black to font-bold and size to text-2xl */}
          <h2 className="mt-1 text-2xl font-semibold leading-snug tracking-tight">
            Hot Deal of the <br /> Month
          </h2>

          {/* Changed to font-semibold and text-sm for a more refined button */}
          <button className="mt-5 rounded-full bg-white px-3 py-1 text-sm font-sans text-slate-900 transition-transform active:scale-95">
            Shop Now
          </button>
        </div>
        <div className="absolute -right-6 -bottom-2 w-56 h-56 z-20">
          <Image
            src="/banner/banner.PNG"
            alt="Promotion"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}
