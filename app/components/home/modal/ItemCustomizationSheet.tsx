import { ChevronLeft } from "lucide-react";
import { CustomGroup, CustomizationPanel } from "./CustomizationPanel";

interface ItemCustomizationSheetProps {
  variationGroups: CustomGroup[];
  addOnGroups: CustomGroup[];
  selections: Record<string, string[]>;
  onSingleSelect: (groupId: string, optionId: string) => void;
  onMultiToggle: (groupId: string, optionId: string) => void;
  onBack: () => void;
}

export function ItemCustomizationSheet({
  variationGroups,
  addOnGroups,
  selections,
  onSingleSelect,
  onMultiToggle,
  onBack,
}: Readonly<ItemCustomizationSheetProps>) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar border-y border-slate-100 bg-slate-50/40">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 px-5 py-3 backdrop-blur border-b border-slate-100">
        <h3 className="text-base font-semibold tracking-wide text-slate-800">
          Customization Details
        </h3>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>

      <div className="px-5 py-4 space-y-6">
        <section>
          <h4 className="text-sm font-semibold tracking-wide text-slate-800">
            Variations & Attributes
          </h4>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Choose size, color, and style for this item.
          </p>
          <CustomizationPanel
            className="mt-3 flex flex-col gap-4"
            customizations={variationGroups}
            selections={selections}
            onSingleSelect={onSingleSelect}
            onMultiToggle={onMultiToggle}
          />
        </section>

        <section>
          <h4 className="text-sm font-semibold tracking-wide text-slate-800">
            Add-ons
          </h4>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Add extras to your order.
          </p>
          <CustomizationPanel
            className="mt-3 flex flex-col gap-4 pb-2"
            customizations={addOnGroups}
            selections={selections}
            onSingleSelect={onSingleSelect}
            onMultiToggle={onMultiToggle}
          />
        </section>
      </div>
    </div>
  );
}
