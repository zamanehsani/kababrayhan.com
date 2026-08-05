import Image from "next/image";
import type { CustomGroup } from "../CustomizationPanel";
import DirhamIcon from "@/app/components/icon/DirhamIcon";

interface ModeCustomizationPanelProps {
  customizations: CustomGroup[];
  selections: Record<string, string[]>;
  onSingleSelect: (groupId: string, optionId: string) => void;
  onMultiToggle: (groupId: string, optionId: string) => void;
  className?: string;
}

export function ModeCustomizationPanel({
  customizations,
  selections,
  onSingleSelect,
  onMultiToggle,
  className,
}: Readonly<ModeCustomizationPanelProps>) {
  return (
    <div className={className ?? "flex flex-col "}>
      {customizations.map((group) => (
        <div key={group.id} className="w-full">
          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {group.options.map((option) => {
              const isSelected = (selections[group.id] || []).includes(
                option.id
              );

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    group.type === "single"
                      ? onSingleSelect(group.id, option.id)
                      : onMultiToggle(group.id, option.id)
                  }
                  /* The entire card acts as the visual selection target */
                  className={`group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.98] ${
                    isSelected
                      ? "border-red-600 bg-red-50/40 shadow-sm ring-1 ring-red-600"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {/* Option Image Block */}
                  {option.img && (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 mb-2">
                      <Image
                        src={option.img}
                        alt={option.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Option Name & Price Block */}
                 <div className="flex flex-col gap-1 w-full">
                    <span
                      className={`text-xs sm:text-sm font-normal leading-tight line-clamp-2 ${
                        isSelected ? "text-red-950" : "text-slate-600"
                      }`}
                    >
                      {option.name}
                    </span>

                    {option.price > 0 && (
                      <div
                        className={`flex items-center text-[11px] font-bold ${
                          isSelected ? "text-red-600" : "text-red-600"
                        }`}
                      >
                        <span>+</span>
                        <DirhamIcon size={10} className="mr-0.5 text-red-600" />
                        <span>{option.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

