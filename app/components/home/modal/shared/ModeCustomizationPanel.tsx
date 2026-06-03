import { Check } from "lucide-react";
import Image from "next/image";
import type { CustomGroup } from "../CustomizationPanel";

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
    <div className={className ?? "flex flex-col gap-6"}>
      {customizations.map((group) => (
        <div key={group.id} className="">
          {/* Changed from flex-col to a grid layout for boxes */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
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
                  /* Changed layout to flex-col, items-center, and text-center for the box style */
                  className={`relative flex flex-col items-center gap-2 rounded-xl border p-2 text-center transition-all duration-150 min-h-[120px] h-full w-full ${
                    isSelected
                      ? "border-red-600 bg-yellow-50/20 ring-1 ring-red-600"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  {/* Absolute positioned selection indicator (Check badge) in the top right/left corner */}
                  <div
                    className={`absolute top-2 left-2 flex h-5 w-5 shrink-0 items-center justify-center border transition-all duration-150 ${
                      group.type === "single" ? "rounded-full" : "rounded-md"
                    } ${
                      isSelected
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </div>

                  {/* Centered content block */}
                  <div className="flex flex-col items-center w-full flex-1 justify-center gap-2">
                    {option.img && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                        <Image
                          src={option.img}
                          alt={option.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="text-sm font-medium tracking-wide text-slate-700 line-clamp-2">
                      {option.name}
                    </span>
                    {option.price > 0 && (
                      <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        AED {option.price.toFixed(2)}
                      </span>
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

