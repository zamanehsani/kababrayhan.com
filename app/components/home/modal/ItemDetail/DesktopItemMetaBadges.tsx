import { Clock, Flame, Star } from "lucide-react";

interface DesktopItemMetaBadgesProps {
  cal: string;
  time: string;
  rating: string;
}

export function DesktopItemMetaBadges({
  cal,
  time,
  rating,
}: Readonly<DesktopItemMetaBadgesProps>) {
  return (
    <div className="mb-6 flex w-fit items-center gap-5 rounded-2xl border border-slate-100/60 bg-slate-50 px-5 py-3 text-sm font-medium tracking-wide text-slate-500">
      <div className="flex items-center gap-1.5">
        <Flame size={15} className="text-red-500" />
        <span>{cal} kcal</span>
      </div>
      <div className="h-4 w-px bg-slate-200" />
      <div className="flex items-center gap-1.5">
        <Clock size={15} className="text-slate-400" />
        <span>Ready in {time}</span>
      </div>
      {/* <div className="h-4 w-px bg-slate-200" /> */}
      {/* <div className="flex items-center gap-1.5">
        <Star size={15} className="fill-red-600 text-red-600" />
        <span className="text-slate-800">{rating} stars</span>
      </div> */}
    </div>
  );
}
