import type {
  CreatePosInvoiceItem,
  CreatePosInvoiceTaxLine,
  CreateSalesOrderItem,
  CreateSalesOrderTaxLine,
} from "@/app/redux/apiType";

export type CheckoutCartEntry = {
  item?: {
    baseItemCode?: string;
    id?: string;
    title?: string;
    item_name?: string;
    baseTitle?: string;
    variationTitle?: string;
    discountedPrice?: number;
    image?: string;
    prep_time?: number;
  };
  qty?: number;
  name?: string;
  price?: number;
  addon?: {
    selectedAddOns?: Array<{ name?: string }>;
    title?: string;
  };
};

export const TAX_TEMPLATE = "Food Tax 5%";
export const VAT_ACCOUNT_HEAD = "Food Tax 5% - P";
export const DELIVERY_FEE_ACCOUNT_HEAD = "Delivery Fee - P";

/** VAT on net total, plus a delivery fee line only when a fee applies. */
export const buildSalesOrderTaxes = (
  deliveryCharge: number
): CreateSalesOrderTaxLine[] => {
  const taxes: CreateSalesOrderTaxLine[] = [
    {
      charge_type: "On Net Total",
      account_head: VAT_ACCOUNT_HEAD,
      description: "VAT 5%",
      rate: 5,
    },
  ];

  if (deliveryCharge > 0) {
    taxes.push({
      charge_type: "Actual",
      account_head: DELIVERY_FEE_ACCOUNT_HEAD,
      description: "Delivery Fee",
      tax_amount: deliveryCharge,
    });
  }

  return taxes;
};

export const buildPosInvoiceTaxes = (
  deliveryCharge: number
): CreatePosInvoiceTaxLine[] => {
  const taxes: CreatePosInvoiceTaxLine[] = [
    {
      charge_type: "On Net Total",
      account_head: VAT_ACCOUNT_HEAD,
      description: "Food Tax 5%",
      rate: 5,
    },
  ];

  if (deliveryCharge > 0) {
    taxes.push({
      charge_type: "Actual",
      account_head: DELIVERY_FEE_ACCOUNT_HEAD,
      description: "Delivery Fee",
      rate: deliveryCharge,
      tax_amount: deliveryCharge,
    });
  }

  return taxes;
};

const buildSelectedAddons = (entry: CheckoutCartEntry) => {
  const selected = Array.isArray(entry.addon?.selectedAddOns)
    ? entry.addon.selectedAddOns
    : [];

  const names = selected
    .map((addOn) => (typeof addOn.name === "string" ? addOn.name.trim() : ""))
    .filter(Boolean);

  if (names.length > 0) {
    return names.join(", ");
  }

  const title = entry.addon?.title?.trim() ?? "";
  if (!title || title.toLowerCase() === "standard portion") {
    return "";
  }

  return title
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .join(", ");
};

export const buildSalesOrderItems = (
  cart: CheckoutCartEntry[]
): CreateSalesOrderItem[] =>
  cart
    .map((entry): CreateSalesOrderItem | null => {
      const item_code = entry.item?.baseItemCode || entry.item?.id;
      if (!item_code) return null;

      const item_name =
        entry.item?.variationTitle && entry.item?.baseTitle
          ? `${entry.item.baseTitle} - ${entry.item.variationTitle}`
          : entry.item?.title || entry.item?.item_name || entry.name;

      const prepTime = Number(entry.item?.prep_time);

      return {
        item_code,
        item_name,
        qty: Number(entry.qty || 1),
        rate: Number(entry.item?.discountedPrice || entry.price || 0),
        custom_selected_addons: buildSelectedAddons(entry),
        prep_time: Number.isFinite(prepTime) ? prepTime : 0,
        is_free_item: 0 as const,
      };
    })
    .filter((item): item is CreateSalesOrderItem => item !== null);

export const buildPosInvoiceItems = (
  cart: CheckoutCartEntry[]
): CreatePosInvoiceItem[] =>
  cart
    .map((entry): CreatePosInvoiceItem | null => {
      const item_code = entry.item?.baseItemCode || entry.item?.id;
      if (!item_code) return null;

      const item_name =
        entry.item?.variationTitle && entry.item?.baseTitle
          ? `${entry.item.baseTitle} - ${entry.item.variationTitle}`
          : entry.item?.title || entry.item?.item_name || entry.name;

      const prepTime = Number(entry.item?.prep_time);

      return {
        item_code: String(item_code),
        item_name,
        qty: Number(entry.qty || 1),
        rate: Number(entry.item?.discountedPrice || entry.price || 0),
        custom_selected_addons: buildSelectedAddons(entry),
        prep_time: Number.isFinite(prepTime) ? prepTime : 0,
      };
    })
    .filter((item): item is CreatePosInvoiceItem => item !== null);

export const cartSubtotal = (cart: CheckoutCartEntry[]) =>
  cart.reduce(
    (sum, entry) => sum + (entry.item?.discountedPrice || 0) * (entry.qty || 1),
    0
  );

export const calculateOrderTotals = (
  subtotal: number,
  deliveryCharge: number = 0
) => {
  const vatAmount = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + vatAmount + deliveryCharge).toFixed(2));
  return {
    subtotal,
    vatAmount,
    deliveryCharge,
    grandTotal,
  };
};

/** Stable signature of everything the draft order mirrors, for change detection. */
export const orderSignature = (input: {
  items: CreateSalesOrderItem[];
  addressId: string;
  deliveryZone: string;
  deliveryCharge: number;
  paymentMethod: string;
  customerNote: string;
}) => JSON.stringify(input);
