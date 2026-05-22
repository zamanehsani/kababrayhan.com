import type { CustomGroup, CustomOption } from "./CustomizationPanel";
import type { ItemDetails } from "@/app/redux/apiType";

const FALLBACK_VARIATION_GROUPS: CustomGroup[] = [
  {
    id: "size",
    title: "Select Size",
    type: "single",
    required: true,
    options: [
      { id: "sz-sm", name: 'Small (10")', price: 0 },
      { id: "sz-md", name: 'Medium (12")', price: 3.5 },
      { id: "sz-lg", name: 'Large (14")', price: 6 },
    ],
  },
  {
    id: "color",
    title: "Choose Color Style",
    type: "single",
    required: false,
    options: [
      { id: "clr-classic", name: "Classic", price: 0 },
      { id: "clr-golden", name: "Golden", price: 0.5 },
      { id: "clr-spicy", name: "Spicy Red", price: 0.8 },
    ],
  },
  {
    id: "style",
    title: "Preparation Style",
    type: "single",
    required: true,
    options: [
      { id: "st-regular", name: "Regular", price: 0 },
      { id: "st-light", name: "Light", price: 0 },
      { id: "st-premium", name: "Chef Premium", price: 2 },
    ],
  },
];

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toStringValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

const splitStringValues = (value: string) =>
  value
    .split(/[,\n|]/)
    .map((part) => part.trim())
    .filter(Boolean);

const normalizeOptionName = (raw: unknown) => {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return (
      toStringValue(obj.name) ||
      toStringValue(obj.label) ||
      toStringValue(obj.value) ||
      toStringValue(obj.attribute_value)
    );
  }
  return "";
};

const normalizeOptions = (
  list: unknown[],
  idPrefix: string,
  basePrice = 0
): CustomOption[] => {
  return list
    .map((entry, index) => {
      if (typeof entry === "string") {
        const name = entry.trim();
        if (!name) return null;
        return {
          id: `${idPrefix}-${slugify(name)}-${index}`,
          name,
          price: basePrice,
        } satisfies CustomOption;
      }

      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const name = normalizeOptionName(row);
      if (!name) return null;

      return {
        id:
          toStringValue(row.id) ||
          toStringValue(row.name) ||
          `${idPrefix}-${slugify(name)}-${index}`,
        name,
        price:
          toNumber(row.price) ||
          toNumber(row.rate) ||
          toNumber(row.additional_price) ||
          basePrice,
      } satisfies CustomOption;
    })
    .filter((option): option is CustomOption => Boolean(option));
};

const getAttributeTitle = (attr: Record<string, unknown>) =>
  toStringValue(attr.attribute) ||
  toStringValue(attr.title) ||
  toStringValue(attr.label);

const getAttributeRawValues = (attr: Record<string, unknown>): unknown[] => {
  if (Array.isArray(attr.options)) return attr.options as unknown[];
  if (Array.isArray(attr.values)) return attr.values as unknown[];
  if (Array.isArray(attr.attribute_values)) {
    return attr.attribute_values as unknown[];
  }

  const optionsText = toStringValue(attr.options);
  if (optionsText) return splitStringValues(optionsText);

  const valuesText = toStringValue(attr.values);
  if (valuesText) return splitStringValues(valuesText);

  const attributeValue = toStringValue(attr.attribute_value);
  if (attributeValue) return [attributeValue];

  return [];
};

const createVariationGroup = (
  attr: Record<string, unknown>,
  groupIndex: number
): CustomGroup | null => {
  const title = getAttributeTitle(attr);
  if (!title) return null;

  const rawValues = getAttributeRawValues(attr);
  const options = normalizeOptions(rawValues, `attr-${groupIndex}`);
  if (options.length === 0) return null;

  return {
    id: `attr-${slugify(title)}-${groupIndex}`,
    title,
    type: "single",
    required: true,
    options,
  };
};

const extractVariationGroups = (
  itemDetails?: ItemDetails
): CustomGroup[] => {
  const attributes = Array.isArray(itemDetails?.attributes)
    ? itemDetails.attributes
    : [];

  const derivedGroups = attributes
    .map((attr, groupIndex) => createVariationGroup(attr, groupIndex))
    .filter((group): group is CustomGroup => group !== null);

  if (derivedGroups.length > 0) return derivedGroups;
  return FALLBACK_VARIATION_GROUPS;
};

const extractAddOnGroups = (itemDetails?: ItemDetails): CustomGroup[] => {
  let allowedAddOns = [] as NonNullable<ItemDetails["allowed_add_ons"]>;

  if (Array.isArray(itemDetails?.custom_allowed_addons)) {
    allowedAddOns = itemDetails.custom_allowed_addons;
  } else if (Array.isArray(itemDetails?.allowed_add_ons)) {
    allowedAddOns = itemDetails.allowed_add_ons;
  }

  const allowedAddOnOptions = allowedAddOns
    .map((row, index) => {
      const name = toStringValue(row.add_on);
      if (!name) return null;

      return {
        id: `allowed-addon-${slugify(name)}-${index}`,
        name,
        price: toNumber(row.price),
      } satisfies CustomOption;
    })
    .filter((option): option is CustomOption => Boolean(option));

  if (allowedAddOnOptions.length > 0) {
    return [
      {
        id: "allowed-add-ons",
        title: "Add-ons",
        type: "multiple",
        required: false,
        options: allowedAddOnOptions,
      } satisfies CustomGroup,
    ];
  }

  const possibleKeys = [
    "custom_allowed_addons",
    "addons",
    "add_ons",
    "add_on_items",
    "item_addons",
    "custom_addons",
  ] as const;

  const rawList = possibleKeys
    .map((key) => itemDetails?.[key])
    .find((entry) => Array.isArray(entry));

  const options = Array.isArray(rawList)
    ? normalizeOptions(rawList, "addon")
    : [];

  if (options.length > 0) {
    return [
      {
        id: "addons",
        title: "Add-ons",
        type: "multiple",
        required: false,
        options,
      } satisfies CustomGroup,
    ];
  }

  return [];
};

export const buildCustomizationSections = (
  itemDetails?: ItemDetails
): { variationGroups: CustomGroup[]; addOnGroups: CustomGroup[] } => ({
  variationGroups: extractVariationGroups(itemDetails),
  addOnGroups: extractAddOnGroups(itemDetails),
});
