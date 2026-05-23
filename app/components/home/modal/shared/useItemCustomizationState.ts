import { useMemo, useState } from "react";
import { useGetItemByCodeQuery, useGetItemsQuery } from "@/app/redux/api";
import type { Item } from "@/app/redux/apiType";
import type { CustomGroup, CustomOption } from "../CustomizationPanel";
import { buildCustomizationSections } from "../customizationOptions";

type CustomizationSections = {
  variationGroups: CustomGroup[];
  addOnGroups: CustomGroup[];
};

const VARIANT_SELECTION_GROUP_ID = "variant-selection";

const toVariantAttributeLabel = (attributes: Item["attributes"] | undefined) => {
  if (!Array.isArray(attributes)) return "";

  const labels = attributes
    .map((attribute) => {
      if (!attribute || typeof attribute !== "object") return "";

      const row = attribute;
      const key =
        typeof row.attribute === "string" ? row.attribute.trim() : "";
      const value =
        typeof row.attribute_value === "string"
          ? row.attribute_value.trim()
          : "";

      if (key && value) return `${key}: ${value}`;
      return value || key;
    })
    .filter((label): label is string => Boolean(label));

  return labels.join(" • ");
};

interface UseItemCustomizationStateResult {
  variationGroups: CustomGroup[];
  addOnGroups: CustomGroup[];
  resolvedSelections: Record<string, string[]>;
  selectedCount: number;
  selectedAddOns: CustomOption[];
  selectedAddOnPrice: number;
  selectedVariantItem?: Item;
  isVariantSelectionRequired: boolean;
  isVariantDataLoading: boolean;
  variantOptionsCount: number;
  canAddToCart: boolean;
  handleSingleSelect: (groupId: string, optionId: string) => void;
  handleMultiToggle: (groupId: string, optionId: string) => void;
}

export function useItemCustomizationState(
  itemId: string | number | undefined,
  expectVariantSelection = false
): UseItemCustomizationStateResult {
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const itemCode = useMemo(() => String(itemId ?? ""), [itemId]);
  const { data: fullItemData, isFetching: isItemLoading } = useGetItemByCodeQuery(
    itemCode,
    {
      skip: !itemCode,
    }
  );
  const { data: allItems } = useGetItemsQuery(undefined, {
    skip: !itemCode,
  });

  const { variationGroups: baseVariationGroups, addOnGroups } =
    useMemo<CustomizationSections>(
    () => buildCustomizationSections(fullItemData),
    [fullItemData]
  );

  const isTemplateWithVariants = useMemo(() => {
    const hasVariantsRaw = fullItemData?.has_variants;
    const hasVariants =
      typeof hasVariantsRaw === "number"
        ? hasVariantsRaw === 1
        : Boolean(hasVariantsRaw);
    const isVariantItem = Boolean(fullItemData?.variant_of);

    return hasVariants && !isVariantItem;
  }, [fullItemData]);

  const isVariantSelectionRequired =
    expectVariantSelection || isTemplateWithVariants;

  const variantItems = useMemo(() => {
    if (!isVariantSelectionRequired || !Array.isArray(allItems)) return [];

    return allItems.filter((item) => {
      const parentCode =
        typeof item.variant_of === "string" ? item.variant_of.trim() : "";
      return Boolean(parentCode) && parentCode === itemCode;
    });
  }, [allItems, isVariantSelectionRequired, itemCode]);

  const variantSelectionGroup = useMemo<CustomGroup | null>(() => {
    if (!isVariantSelectionRequired || variantItems.length === 0) return null;

    const options = variantItems
      .map((variant, index) => {
        const variantCode =
          typeof variant.item_code === "string" ? variant.item_code.trim() : "";
        const fallbackCode =
          typeof variant.name === "string" ? variant.name.trim() : "";
        const optionId = variantCode || fallbackCode;
        if (!optionId) return null;

        const attributeLabel = toVariantAttributeLabel(variant.attributes);
        const optionName =
          attributeLabel ||
          (typeof variant.item_name === "string" ? variant.item_name.trim() : "") ||
          optionId;

        return {
          id: optionId,
          name: optionName,
          price:
            typeof variant.standard_rate === "number" &&
            Number.isFinite(variant.standard_rate)
              ? variant.standard_rate
              : 0,
        } satisfies CustomOption;
      })
      .filter((option): option is CustomOption => Boolean(option));

    if (options.length === 0) return null;

    return {
      id: VARIANT_SELECTION_GROUP_ID,
      title: "Choose an option",
      type: "single",
      required: true,
      autoSelectFirst: false,
      options,
    };
  }, [isVariantSelectionRequired, variantItems]);

  const variationGroups = useMemo(() => {
    const hasRealAttributes =
      Array.isArray(fullItemData?.attributes) && fullItemData.attributes.length > 0;
    const normalizedVariationGroups =
      variantSelectionGroup && !hasRealAttributes ? [] : baseVariationGroups;

    return variantSelectionGroup
      ? [variantSelectionGroup, ...normalizedVariationGroups]
      : normalizedVariationGroups;
  }, [baseVariationGroups, fullItemData, variantSelectionGroup]);

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
        const shouldAutoSelectFirst = group.autoSelectFirst !== false;

        if (
          group.required &&
          shouldAutoSelectFirst &&
          normalized.length === 0 &&
          group.options[0]
        ) {
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

  const selectedAddOns = useMemo(() => {
    const selectedOptionIds = new Set(
      addOnGroups.flatMap((group) => resolvedSelections[group.id] ?? [])
    );

    return addOnGroups.flatMap((group) =>
      group.options.filter((option) => selectedOptionIds.has(option.id))
    );
  }, [addOnGroups, resolvedSelections]);

  const selectedVariantCode =
    resolvedSelections[VARIANT_SELECTION_GROUP_ID]?.[0] ?? "";

  const selectedVariantItem = useMemo(() => {
    if (!selectedVariantCode) return undefined;

    return variantItems.find((variant) => {
      const optionId =
        (typeof variant.item_code === "string" ? variant.item_code.trim() : "") ||
        (typeof variant.name === "string" ? variant.name.trim() : "");
      return optionId === selectedVariantCode;
    });
  }, [selectedVariantCode, variantItems]);

  const hasMissingRequiredSelections = useMemo(
    () =>
      allCustomizationGroups.some((group) => {
        if (!group.required) return false;
        const selectedIds = resolvedSelections[group.id] ?? [];
        return selectedIds.length === 0;
      }),
    [allCustomizationGroups, resolvedSelections]
  );

  const variantOptionsCount = variantSelectionGroup?.options.length ?? 0;
  const isVariantDataLoading =
    isVariantSelectionRequired && (isItemLoading || allItems === undefined);

  const canAddToCart = useMemo(() => {
    if (hasMissingRequiredSelections) return false;

    if (!isVariantSelectionRequired) return true;

    if (variantOptionsCount === 0) return false;

    return Boolean(selectedVariantItem);
  }, [
    hasMissingRequiredSelections,
    isVariantSelectionRequired,
    selectedVariantItem,
    variantOptionsCount,
  ]);

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
    selectedVariantItem,
    isVariantSelectionRequired,
    isVariantDataLoading,
    variantOptionsCount,
    canAddToCart,
    handleSingleSelect,
    handleMultiToggle,
  };
}
