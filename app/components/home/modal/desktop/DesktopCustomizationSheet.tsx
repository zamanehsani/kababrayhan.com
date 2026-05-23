import { ChevronLeft } from "lucide-react";
import type { CustomGroup } from "../CustomizationPanel";
import { ModeCustomizationPanel } from "../shared/ModeCustomizationPanel";

interface DesktopCustomizationSheetProps {
  variationGroups: CustomGroup[];
  addOnGroups: CustomGroup[];
  selections: Record<string, string[]>;
  onSingleSelect: (groupId: string, optionId: string) => void;
  onMultiToggle: (groupId: string, optionId: string) => void;
  onBack: () => void;
}

export function DesktopCustomizationSheet({
  variationGroups,
  addOnGroups,
  selections,
  onSingleSelect,
  onMultiToggle,
  onBack,
}: Readonly<DesktopCustomizationSheetProps>) {
  const hasVariationGroups = variationGroups.length > 0;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-slate-50/40">
      <div className="relative flex items-center border-b border-slate-100 bg-white/90 px-8 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-label="Back to item details"
        >
          <ChevronLeft size={13} className="shrink-0" />
          <span>Back</span>
        </button>
        <h3 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-base font-medium tracking-wide text-slate-800">
          Customize your order
        </h3>
      </div>

      <div className={`grid min-h-0 gap-6 px-8 py-5 ${
        hasVariationGroups ? "grid-cols-2" : "grid-cols-1"
      }`}>
        {hasVariationGroups && (
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium tracking-wide text-slate-800">
              Choose your option
            </h4>
            <p className="mt-1 text-xs font-normal tracking-wide text-slate-500">
              Select from the available options for this item.
            </p>

            <div className="mt-3 min-h-0 flex-1 overflow-y-scroll pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
              <ModeCustomizationPanel
                className="flex flex-col gap-4"
                customizations={variationGroups}
                selections={selections}
                onSingleSelect={onSingleSelect}
                onMultiToggle={onMultiToggle}
              />
            </div>
          </section>
        )}

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-medium tracking-wide text-slate-800">
            Add-ons
          </h4>
          <p className="mt-1 text-xs font-normal tracking-wide text-slate-500">
            Add extras if you like.
          </p>

          <div className="mt-3 min-h-0 flex-1 overflow-y-scroll pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
            <ModeCustomizationPanel
              className="flex flex-col gap-4 pb-2"
              customizations={addOnGroups}
              selections={selections}
              onSingleSelect={onSingleSelect}
              onMultiToggle={onMultiToggle}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
