import type { ModeOfPayment } from "@/app/redux/apiType";

export type PaymentMethodType = "card_online" | "cod" | "card_on_delivery";

export type PaymentOption = {
  id: PaymentMethodType;
  label: string;
  /** ERPNext Mode of Payment name backing this option, when available. */
  mode?: string;
};

export const DEFAULT_PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "cod", label: "Cash on Delivery" },
  { id: "card_on_delivery", label: "Card on Delivery" },
  { id: "card_online", label: "Pay Online" },
];

const ORDERED_IDS: PaymentMethodType[] = ["cod", "card_on_delivery", "card_online"];

const classifyMode = (mode: ModeOfPayment): PaymentMethodType | null => {
  const name = mode.name.toLowerCase();

  if (/online|stripe|link|wallet|apple|google|gateway/.test(name)) {
    return "card_online";
  }
  if (name.includes("cash")) return "cod";
  if (/card|pos|terminal|machine|doorstep|delivery/.test(name)) {
    return "card_on_delivery";
  }

  return null;
};

/** Maps enabled ERPNext Modes of Payment onto the three checkout flows. */
export const toPaymentOptions = (
  modes: ModeOfPayment[] | undefined
): PaymentOption[] => {
  if (!modes?.length) {
    return DEFAULT_PAYMENT_OPTIONS;
  }

  const matched = new Map<PaymentMethodType, PaymentOption>();

  for (const mode of modes) {
    const id = classifyMode(mode);
    if (!id || matched.has(id)) continue;

    const fallbackLabel =
      DEFAULT_PAYMENT_OPTIONS.find((option) => option.id === id)?.label ??
      mode.name;

    matched.set(id, { id, label: fallbackLabel, mode: mode.name });
  }

  const options = ORDERED_IDS.map((id) => matched.get(id)).filter(
    (option): option is PaymentOption => Boolean(option)
  );

  return options.length ? options : DEFAULT_PAYMENT_OPTIONS;
};
