import { ChevronDown } from "lucide-react";

interface DesktopCustomizationTriggersProps {
  hasVariations: boolean;
  hasAddOns: boolean;
  selectedCount: number;
  onOpen: () => void;
}

export function DesktopCustomizationTriggers({
  hasVariations,
  hasAddOns,
  selectedCount,
  onOpen,
}: Readonly<DesktopCustomizationTriggersProps>) {
  return (
    <div className="mt-5 flex flex-col gap-2">
      {hasVariations && (
        <button
          type="button"
          onClick={onOpen}
          className="flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium tracking-wide text-orange-600 transition-colors hover:bg-orange-100"
        >
          <span>Options available</span>
          {selectedCount > 0 && (
            <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">
              {selectedCount} chosen
            </span>
          )}
          <ChevronDown size={12} />
        </button>
      )}
      {hasAddOns && (
        <button
          type="button"
          onClick={onOpen}
          className="flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium tracking-wide text-emerald-600 transition-colors hover:bg-emerald-100"
        >
          <span>Add-ons available</span>
          <ChevronDown size={12} />
        </button>
      )}
    </div>
  );
}
