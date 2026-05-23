import { Check } from "lucide-react";

export interface CustomOption {
  id: string;
  name: string;
  price: number;
}

export interface CustomGroup {
  id: string;
  title: string;
  type: "single" | "multiple";
  required: boolean;
  autoSelectFirst?: boolean;
  options: CustomOption[];
}

interface CustomizationPanelProps {
  customizations: CustomGroup[];
  selections: Record<string, string[]>;
  onSingleSelect: (groupId: string, optionId: string) => void;
  onMultiToggle: (groupId: string, optionId: string) => void;
  className?: string;
}

export function CustomizationPanel({
  customizations,
  selections,
  onSingleSelect,
  onMultiToggle,
  className,
}: Readonly<CustomizationPanelProps>) {
  return (
    <div className={className ?? "flex flex-col gap-5"}>
      {customizations.map((group) => (
        <div
          key={group.id}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {group.title}
            </h3>
            {group.required ? (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">
                Required
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400">
                Optional
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
                  className={`flex items-center justify-between w-full p-3 rounded-xl border text-left transition-all duration-150 ${
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
                          ? "bg-yellow-400 border-yellow-400 text-slate-900"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {option.name}
                    </span>
                  </div>
                  {option.price > 0 && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      +AED {option.price.toFixed(2)}
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
