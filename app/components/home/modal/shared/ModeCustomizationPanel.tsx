import { Check } from "lucide-react";
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
    <div className={className ?? "flex flex-col gap-4"}>
      {customizations.map((group) => (
        <div
          key={group.id}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-600">
              {group.title}
            </h3>
            {group.required ? (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                REQUIRED
              </span>
            ) : (
              <span className="text-[10px] font-normal text-slate-400">
                OPTIONAL
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
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
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-yellow-400 bg-yellow-50/20 ring-1 ring-yellow-400"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-all duration-150 ${
                        group.type === "single" ? "rounded-full" : "rounded-md"
                      } ${
                        isSelected
                          ? "border-yellow-400 bg-yellow-400 text-slate-900"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium tracking-wide text-slate-700">
                      {option.name}
                    </span>
                  </div>
                  {option.price > 0 && (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      +${option.price.toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
