import React from "react";
import Link from "next/link";

interface CheckoutHeaderProps {
  title: string;
  subtitle: string;
  tag?: string;
  backLink?: string;
  backLabel?: string;
  onClick?: () => void;
}

const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({
  title,
  subtitle,
  tag = "Checkout",
  backLink = "/",
  backLabel = "Back to Plate",
  onClick,
}) => {
  return (
    <header className="mb-12">
      {/* Top Row: Tag and Back Button */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {/* Brand Pill */}
          <div className="h-1.5 w-4 rounded-full bg-red-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600">
            {tag}
          </p>
        </div>

        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 transition-all hover:text-red-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-3 h-3 transition-transform group-hover:-translate-x-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            {backLabel}
          </button>
        ) : (
          <Link
            href={backLink}
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 transition-all hover:text-red-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-3 h-3 transition-transform group-hover:-translate-x-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            {backLabel}
          </Link>
        )}
      </div>

      {/* Main Title Area */}
      <div className="max-w-2xl">
        <h1 className="text-2xl font-black tracking-[-0.03em] text-stone-900 md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-stone-500/80">
          {subtitle}
        </p>
      </div>

      {/* Decorative separator - Premium Subtle Gradient */}
      <div className="mt-8 h-px w-full bg-linear-to-r from-stone-200 via-stone-100 to-transparent opacity-50" />
    </header>
  );
};

export default CheckoutHeader;