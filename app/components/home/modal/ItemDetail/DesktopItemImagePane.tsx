import Image from "next/image";

interface DesktopItemImagePaneProps {
  src: string;
  alt: string;
}

export function DesktopItemImagePane({
  src,
  alt,
}: Readonly<DesktopItemImagePaneProps>) {
  return (
    <div className="col-span-5 relative flex items-center justify-center border-r border-slate-100/80 bg-slate-50/60 p-8">
      <div className="pointer-events-none absolute inset-0 scale-120 opacity-20 blur-3xl">
        <Image src={src} alt="" fill className="object-cover" />
      </div>
      <div className="relative h-full w-full transition-transform duration-500 hover:scale-105">
        <Image src={src} alt={alt} fill className="object-contain" priority />
      </div>
    </div>
  );
}
