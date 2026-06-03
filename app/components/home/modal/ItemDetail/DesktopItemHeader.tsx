interface DesktopItemHeaderProps {
  restaurant: string;
  name: string;
}

export function DesktopItemHeader({
  restaurant,
  name,
}: Readonly<DesktopItemHeaderProps>) {
  return (
    <div className="pl-8 pr-24 pb-5 pt-7">
      <span className="text-xs font-medium uppercase tracking-wide text-red-500">
        {restaurant}
      </span>
      <h1 className="mt-1 text-3xl font-medium tracking-wide text-slate-900">
        {name}
      </h1>
    </div>
  );
}
