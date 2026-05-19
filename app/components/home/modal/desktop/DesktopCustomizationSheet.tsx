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
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-slate-50/40">
      <div className="flex items-center justify-between border-b border-slate-100 bg-white/90 px-8 py-3 backdrop-blur">
        <h3 className="text-base font-medium tracking-wide text-slate-800">
          Customization Details
        </h3>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-medium tracking-wide text-slate-500"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>

      <div className="grid min-h-0 grid-cols-2 gap-6 px-8 py-5">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-medium tracking-wide text-slate-800">
            Variations and Attributes
          </h4>
          <p className="mt-1 text-xs font-normal tracking-wide text-slate-500">
            Choose size, color, and style for this item.
          </p>

          <div className="mt-3 min-h-0 flex-1 overflow-y-scroll pr-1">
            <ModeCustomizationPanel
              className="flex flex-col gap-4"
              customizations={variationGroups}
              selections={selections}
              onSingleSelect={onSingleSelect}
              onMultiToggle={onMultiToggle}
            />
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-medium tracking-wide text-slate-800">
            Add-ons
          </h4>
          <p className="mt-1 text-xs font-normal tracking-wide text-slate-500">
            Add extras to your order.
          </p>

          <div className="mt-3 min-h-0 flex-1 overflow-y-scroll pr-1">
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
