import { ChevronDown } from "lucide-react";
import type { CustomGroup } from "../CustomizationPanel";
import { ModeCustomizationPanel } from "../shared/ModeCustomizationPanel";

interface DesktopCustomizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  variationGroups: CustomGroup[];
  addOnGroups: CustomGroup[];
  resolvedSelections: Record<string, string[]>;
  onSingleSelect: (groupId: string, optionId: string) => void;
  onMultiToggle: (groupId: string, optionId: string) => void;
}

export function DesktopCustomizationDrawer({
  isOpen,
  onClose,
  selectedCount,
  variationGroups,
  addOnGroups,
  resolvedSelections,
  onSingleSelect,
  onMultiToggle,
}: Readonly<DesktopCustomizationDrawerProps>) {
  const hasBothGroups = variationGroups.length > 0 && addOnGroups.length > 0;

  return (
    <div
      className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Header */}
      <div className="relative flex shrink-0 items-center border-b border-slate-100 px-6 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close options"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ChevronDown size={16} />
        </button>
        <h3 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-medium tracking-wide text-slate-800">
          Customize your order
        </h3>
        {selectedCount > 0 && (
          <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-red-700">
            {selectedCount} chosen
          </span>
        )}
      </div>

      {/* Scrollable content */}
      <div
        className={`flex-1 overflow-y-auto no-scrollbar grid content-start gap-5 px-6 py-4 ${
          hasBothGroups ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {variationGroups.length > 0 && (
          <section className="flex flex-col rounded-2xl  bg-slate-50/60 p-4">
            <h4 className="text-sm font-medium tracking-wide text-slate-800">
              Choose your option
            </h4>
            <p className="mt-1 text-xs tracking-wide text-slate-500">
              Select one to continue.
            </p>
            <div className="mt-3">
              <ModeCustomizationPanel
                className="flex flex-col gap-3"
                customizations={variationGroups}
                selections={resolvedSelections}
                onSingleSelect={onSingleSelect}
                onMultiToggle={onMultiToggle}
              />
            </div>
          </section>
        )}
        {addOnGroups.length > 0 && (
          <section className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <h4 className="text-sm font-medium tracking-wide text-slate-800">
              Add-ons
            </h4>
            <p className="mt-1 text-xs tracking-wide text-slate-500">
              Add extras if you like.
            </p>
            <div className="mt-3">
              <ModeCustomizationPanel
                className="flex flex-col gap-3"
                customizations={addOnGroups}
                selections={resolvedSelections}
                onSingleSelect={onSingleSelect}
                onMultiToggle={onMultiToggle}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
