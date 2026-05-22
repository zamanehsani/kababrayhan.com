import { useEffect, useMemo, useState } from "react";
import { useGetItemByCodeQuery } from "@/app/redux/api";
import type { CustomGroup, CustomOption } from "../CustomizationPanel";
import { buildCustomizationSections } from "../customizationOptions";

type CustomizationSections = {
  variationGroups: CustomGroup[];
  addOnGroups: CustomGroup[];
};

interface UseItemCustomizationStateResult {
  variationGroups: CustomGroup[];
  addOnGroups: CustomGroup[];
  resolvedSelections: Record<string, string[]>;
  selectedCount: number;
  selectedAddOns: CustomOption[];
  selectedAddOnPrice: number;
  handleSingleSelect: (groupId: string, optionId: string) => void;
  handleMultiToggle: (groupId: string, optionId: string) => void;
}

export function useItemCustomizationState(
  itemId: string | number | undefined
): UseItemCustomizationStateResult {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [selectedAddOns, setSelectedAddOns] = useState<CustomOption[]>([]);

  const itemCode = useMemo(() => String(itemId ?? ""), [itemId]);
  const { data: fullItemData } = useGetItemByCodeQuery(itemCode, {
    skip: !itemCode,
  });

  const { variationGroups, addOnGroups } = useMemo<CustomizationSections>(
    () => buildCustomizationSections(fullItemData),
    [fullItemData]
  );

  const allCustomizationGroups = useMemo(
    () => [...variationGroups, ...addOnGroups],
    [variationGroups, addOnGroups]
  );

  const resolvedSelections = useMemo(() => {
    const next: Record<string, string[]> = {};

    allCustomizationGroups.forEach((group) => {
      const optionIds = new Set(group.options.map((option) => option.id));
      const currentSelection = (selections[group.id] || []).filter((id) =>
        optionIds.has(id)
      );

      if (group.type === "single") {
        const normalized = currentSelection.slice(0, 1);
        if (group.required && normalized.length === 0 && group.options[0]) {
          next[group.id] = [group.options[0].id];
        } else {
          next[group.id] = normalized;
        }
        return;
      }

      next[group.id] = currentSelection;
    });

    return next;
  }, [allCustomizationGroups, selections]);

  const selectedCount = useMemo(
    () =>
      Object.values(resolvedSelections).reduce(
        (total, group) => total + group.length,
        0
      ),
    [resolvedSelections]
  );

  useEffect(() => {
    const selectedOptionIds = new Set(
      addOnGroups.flatMap((group) => resolvedSelections[group.id] ?? [])
    );

    const nextSelectedAddOns = addOnGroups.flatMap((group) =>
      group.options.filter((option) => selectedOptionIds.has(option.id))
    );

    setSelectedAddOns(nextSelectedAddOns);
  }, [addOnGroups, resolvedSelections]);

  const selectedAddOnPrice = useMemo(
    () => selectedAddOns.reduce((total, addOn) => total + addOn.price, 0),
    [selectedAddOns]
  );

  const handleSingleSelect = (groupId: string, optionId: string) => {
    setSelections((current) => ({
      ...current,
      [groupId]: [optionId],
    }));
  };

  const handleMultiToggle = (groupId: string, optionId: string) => {
    setSelections((current) => {
      const currentGroupSelection =
        current[groupId] ?? resolvedSelections[groupId] ?? [];
      const isSelected = currentGroupSelection.includes(optionId);

      return {
        ...current,
        [groupId]: isSelected
          ? currentGroupSelection.filter((id) => id !== optionId)
          : [...currentGroupSelection, optionId],
      };
    });
  };

  return {
    variationGroups,
    addOnGroups,
    resolvedSelections,
    selectedCount,
    selectedAddOns,
    selectedAddOnPrice,
    handleSingleSelect,
    handleMultiToggle,
  };
}
