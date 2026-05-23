import type { CustomGroup } from "../CustomizationPanel";
import { ModeCustomizationPanel } from "../shared/ModeCustomizationPanel";

interface TabletCustomizationSheetProps {
  variationGroups: CustomGroup[];
  addOnGroups: CustomGroup[];
  selections: Record<string, string[]>;
  onSingleSelect: (groupId: string, optionId: string) => void;
  onMultiToggle: (groupId: string, optionId: string) => void;
  onBack: () => void;
}

export function TabletCustomizationSheet({
  variationGroups,
  addOnGroups,
  selections,
  onSingleSelect,
  onMultiToggle,
  onBack,
}: Readonly<TabletCustomizationSheetProps>) {
  const hasVariationGroups = variationGroups.length > 0;

  return (
    <div className="flex h-full flex-col border-y border-slate-100 bg-slate-50/40">
      {/* <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-3 backdrop-blur">
        <h3 className="text-base font-medium tracking-wide text-slate-800">
          Customize your order
        </h3>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-medium tracking-wide text-slate-500"
        >
          <ChevronLeft size={14} />
          Back to item
        </button>
      </div> */}

      <div className="space-y-6 px-6 py-4">
        {hasVariationGroups && (
          <section>
            <h4 className="text-sm font-medium tracking-wide text-slate-800">
              Choose your option
            </h4>
            <p className="mt-1 text-xs font-normal tracking-wide text-slate-500">
              Select from the available options for this item.
            </p>
            <ModeCustomizationPanel
              className="mt-3 flex flex-col gap-4"
              customizations={variationGroups}
              selections={selections}
              onSingleSelect={onSingleSelect}
              onMultiToggle={onMultiToggle}
            />
          </section>
        )}

        <section>
          <h4 className="text-sm font-medium tracking-wide text-slate-800">
            Add-ons
          </h4>
          <p className="mt-1 text-xs font-normal tracking-wide text-slate-500">
            Add extras if you like.
          </p>
          <ModeCustomizationPanel
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
