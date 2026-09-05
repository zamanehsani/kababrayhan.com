"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  useCreatePosInvoiceMutation,
  useSubmitPosInvoiceMutation,
  useCreatePaymentIntentMutation,
  useGetCustomerAddressesQuery,
  useGetModesOfPaymentQuery,
  type Customer,
} from "../redux/api";
import type { CreatePosInvoiceRequest } from "../redux/apiType";
import { readStoredCustomer } from "@/app/components/customerStorage";
import {
  CUSTOMER_PORTAL_UPDATED,
  getCustomerName,
  saveDeliveryAddress,
  writeDeliveryAddresses,
} from "@/app/lib/customerPortal";
import {
  clearPendingCheckout,
  clearPendingSalesOrder,
} from "@/app/components/orderStorage";
import { CART_UPDATED, saveCart } from "@/app/lib/cart";
import {
  buildPosInvoiceItems,
  buildPosInvoiceTaxes,
  calculateOrderTotals,
  cartSubtotal,
  type CheckoutCartEntry,
} from "@/app/lib/salesOrder";
import {
  toPaymentOptions,
  type PaymentMethodType,
  type PaymentOption,
} from "@/app/lib/paymentMethods";

import CheckoutStepper from "../components/Checkout/CheckoutStepper";
import OrderSummary from "../components/Checkout/OrderSummary";
import CheckoutForm, {
  type DeliveryAddressItem,
} from "../components/Checkout/CheckoutForm";
import CustomerNote from "../components/Checkout/CustomerNote";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import DirhamIcon from "../components/icon/DirhamIcon";
import PaymentErrorSection from "../components/Checkout/PaymentErrorSection";
import DoorstepPaymentWrapper from "../components/Checkout/DoorstepPaymentWrapper";

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  process.env.STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

if (!stripeKey) {
  console.error(
    "Stripe publishable key is missing. Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
  );
}

const hasWindow = () => typeof window !== "undefined";

const readCart = (): CheckoutCartEntry[] => {
  if (!hasWindow()) return [];
  try {
    return JSON.parse(globalThis.localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
};

const readDeliveryInfo = () => {
  if (!hasWindow()) {
    return { zone: "", charge: 0, addressId: "" };
  }

  return {
    zone: globalThis.localStorage.getItem("uae_delivery_zone") || "",
    charge:
      Number.parseFloat(
        globalThis.localStorage.getItem("uae_delivery_charge") || "0"
      ) || 0,
    addressId:
      globalThis.localStorage.getItem("uae_delivery_address_id") ||
      globalThis.localStorage.getItem("uae_address_id") ||
      "",
  };
};

const readStoredDeliveryAddresses = (): DeliveryAddressItem[] => {
  if (!hasWindow()) return [];

  const raw = globalThis.localStorage.getItem("uae_delivery_addresses");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // fall through to the single-address fallback below
    }
  }

  return [
    {
      title: "Home",
      address:
        globalThis.localStorage.getItem("uae_delivery_address") ||
        globalThis.localStorage.getItem("uae_address") ||
        "",
      addressId:
        globalThis.localStorage.getItem("uae_delivery_address_id") ||
        globalThis.localStorage.getItem("uae_address_id") ||
        "",
    },
  ];
};

const toDisplayAddressTitle = (
  rawTitle: string,
  addressType: string,
  index: number
) => {
  const segments = rawTitle
    .split("-")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => {
      const normalized = segment.toLowerCase();
      return (
        !segment.startsWith("+") &&
        normalized !== addressType.toLowerCase() &&
        normalized !== "billing" &&
        normalized !== "shipping"
      );
    });

  const candidate = segments.join(" ").trim();
  if (candidate) {
    return candidate.replaceAll(/\b\w/g, (char) => char.toUpperCase());
  }

  return index === 0 ? "Home" : `Address ${index + 1}`;
};

const errorMessageOf = (error: unknown, fallback: string) => {
  const data = (
    error as {
      data?: {
        message?: string;
        exception?: string;
        _server_messages?: string;
      };
    }
  )?.data;

  if (data?._server_messages) {
    try {
      const messages = JSON.parse(data._server_messages) as string[];
      const first = messages[0];
      const parsed = first ? JSON.parse(first) : null;
      const text = (parsed?.message ?? first)?.toString();
      if (text) return text.replaceAll(/<[^>]+>/g, " ").trim();
    } catch {
      // fall through to the generic fields below
    }
  }

  return data?.message || data?.exception || fallback;
};

const resolveModeName = (
  method: PaymentMethodType,
  options: PaymentOption[]
) => {
  const match = options.find((option) => option.id === method);
  if (match?.mode) return match.mode;

  if (method === "cod") return "Cash";
  if (method === "card_on_delivery") return "Card";
  return "Online";
};

const CheckoutPage = () => {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(() =>
    hasWindow() ? readStoredCustomer() : null
  );
  const [cart, setCart] = useState<CheckoutCartEntry[]>(readCart);
  const [delivery, setDelivery] = useState(readDeliveryInfo);
  const [form, setForm] = useState(() => ({
    phone: hasWindow() ? globalThis.localStorage.getItem("uae_phone") || "" : "",
    address: hasWindow()
      ? globalThis.localStorage.getItem("uae_address") || ""
      : "",
    deliveryAddresses: readStoredDeliveryAddresses(),
  }));

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("cod");
  const [customerNote, setCustomerNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showAddressWarning, setShowAddressWarning] = useState(false);
  const [isAddressCollapsed, setIsAddressCollapsed] = useState(true);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);

  const [createPosInvoice] = useCreatePosInvoiceMutation();
  const [submitPosInvoice] = useSubmitPosInvoiceMutation();
  const [createPaymentIntent] = useCreatePaymentIntentMutation();

  const { data: paymentModes, isLoading: isLoadingPaymentModes } =
    useGetModesOfPaymentQuery();
  const paymentOptions = useMemo(
    () => toPaymentOptions(paymentModes),
    [paymentModes]
  );

  const customerName = customer?.name || getCustomerName() || form.phone;
  const { data: backendAddresses } = useGetCustomerAddressesQuery(customerName, {
    skip: !customerName,
  });

  const total = cartSubtotal(cart);
  const { vatAmount, grandTotal } = calculateOrderTotals(total, delivery.charge);
  const items = useMemo(() => buildPosInvoiceItems(cart), [cart]);
  const taxes = useMemo(
    () => buildPosInvoiceTaxes(delivery.charge),
    [delivery.charge]
  );

  const selectedAddress =
    form.deliveryAddresses.find(
      (address) => address.addressId === delivery.addressId
    ) || form.deliveryAddresses.find((address) => address.addressId);
  const selectedAddressId =
    delivery.addressId ||
    selectedAddress?.addressId ||
    backendAddresses?.[0]?.name ||
    "";

  const intentAmountRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);

  // Keep local state aligned with cart/address changes made elsewhere in the app.
  useEffect(() => {
    const refresh = () => {
      if (isSubmittingRef.current) return;
      const latestCart = readCart();
      setCart(latestCart);
      setDelivery(readDeliveryInfo());
      setCustomer(readStoredCustomer());
    };

    globalThis.addEventListener(CART_UPDATED, refresh);
    globalThis.addEventListener(CUSTOMER_PORTAL_UPDATED, refresh);
    globalThis.addEventListener("storage", refresh);

    return () => {
      globalThis.removeEventListener(CART_UPDATED, refresh);
      globalThis.removeEventListener(CUSTOMER_PORTAL_UPDATED, refresh);
      globalThis.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (readCart().length === 0 && !isSubmittingRef.current) {
      clearPendingSalesOrder();
      clearPendingCheckout();
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!backendAddresses) return;

    const syncedAddresses: DeliveryAddressItem[] = backendAddresses.map(
      (address, index) => ({
        id: address.name,
        title: toDisplayAddressTitle(
          address.address_title,
          address.address_type,
          index
        ),
        address: [address.address_line1, address.address_line2]
          .filter(Boolean)
          .join(", "),
        addressId: address.name,
      })
    );

    const selectedId = readDeliveryInfo().addressId;
    if (selectedId) {
      syncedAddresses.sort((a, b) => {
        if (a.addressId === selectedId) return -1;
        if (b.addressId === selectedId) return 1;
        return 0;
      });
    }

    const nextSnapshot = JSON.stringify(syncedAddresses);
    const currentSnapshot = JSON.stringify(readStoredDeliveryAddresses());
    if (nextSnapshot === currentSnapshot) return;

    const frameId = requestAnimationFrame(() => {
      setForm((previous) => ({
        ...previous,
        deliveryAddresses: syncedAddresses,
        address: syncedAddresses[0]?.address || previous.address,
      }));

      writeDeliveryAddresses(syncedAddresses);

      if (!selectedId && syncedAddresses[0]) {
        saveDeliveryAddress(
          syncedAddresses[0].address,
          syncedAddresses[0].addressId
        );
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [backendAddresses]);

  // Online payments fetch Stripe payment intent for the card / wallets element.
  useEffect(() => {
    if (paymentMethod !== "card_online" || grandTotal <= 0) return;
    if (intentAmountRef.current === grandTotal) return;

    let isStale = false;
    intentAmountRef.current = grandTotal;

    (async () => {
      try {
        console.log("[Checkout] Requesting Stripe PaymentIntent for amount:", grandTotal);
        const intent = await createPaymentIntent({
          amount: grandTotal,
          currency: "aed",
        }).unwrap();

        if (isStale) return;

        console.log("[Checkout] Received Stripe PaymentIntent:", intent);
        setClientSecret(intent.client_secret);
        globalThis.sessionStorage?.setItem(
          "checkout_client_secret",
          intent.client_secret
        );
      } catch (intentError) {
        console.error("[Checkout] Failed to prepare Stripe PaymentIntent:", intentError);
        intentAmountRef.current = null;
        setOrderError(
          errorMessageOf(intentError, "Payment could not be prepared. Please retry.")
        );
      }
    })();

    return () => {
      isStale = true;
    };
  }, [createPaymentIntent, grandTotal, paymentMethod]);

  const handleOrderSubmission = useCallback(
    async (methodType: PaymentMethodType) => {
      if (!customerName || items.length === 0) {
        setOrderError("No items in cart to order.");
        return;
      }

      if (!selectedAddressId) {
        setOrderError("Please select a delivery address before proceeding.");
        setShowAddressWarning(true);
        return;
      }

      setIsSubmitting(true);
      setOrderError(null);

      try {
        const modeName = resolveModeName(methodType, paymentOptions);
        const payload: CreatePosInvoiceRequest = {
          customer: customerName,
          customer_name: customerName,
          pos_profile: "website",
          company:
            process.env.NEXT_PUBLIC_ERP_COMPANY_NAME ||
            "Kabab Al Rayhan Restaurant & Bakery SPS LLC",
          customer_address: selectedAddressId || undefined,
          shipping_address_name: selectedAddressId || undefined,
          customer_note: customerNote || undefined,
          items,
          taxes,
          payments: [
            {
              mode_of_payment: modeName,
              amount: grandTotal,
            },
          ],
        };

        console.log("[Checkout] Sending POS Invoice payload to Frappe:", payload);
        isSubmittingRef.current = true;
        const createdInvoice = await createPosInvoice(payload).unwrap();
        console.log("[Checkout] Received POS Invoice instance from Frappe:", createdInvoice);
        const invoiceName = createdInvoice?.name || "";

        if (methodType === "card_online" && invoiceName) {
          try {
            console.log("[Checkout] Submitting POS Invoice docstatus 1 for online payment:", invoiceName);
            const submitResult = await submitPosInvoice(invoiceName).unwrap();
            console.log("[Checkout] POS Invoice submit result:", submitResult);
          } catch (submitDocErr) {
            console.warn(
              "[Checkout] Client-side submit of POS Invoice deferred to webhook:",
              submitDocErr
            );
          }
        }

        saveCart([]);
        clearPendingCheckout();
        clearPendingSalesOrder();

        if (invoiceName) {
          router.replace(`/thank-you?order=${encodeURIComponent(invoiceName)}`);
        } else {
          router.replace("/thank-you");
        }
      } catch (submitError) {
        isSubmittingRef.current = false;
        console.error("[Checkout] Order submission failed:", submitError);
        setOrderError(
          errorMessageOf(submitError, "We couldn't submit your order. Please retry.")
        );
        throw submitError;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      createPosInvoice,
      submitPosInvoice,
      customerName,
      customerNote,
      grandTotal,
      items,
      paymentOptions,
      router,
      selectedAddressId,
      taxes,
    ]
  );

  const summaryCart = cart.map((entry) => ({
    item: {
      id: entry.item?.id || entry.item?.baseItemCode || "",
      title:
        entry.item?.baseTitle ||
        entry.item?.title ||
        entry.item?.item_name ||
        entry.name ||
        "",
      baseTitle:
        entry.item?.baseTitle ||
        entry.item?.title ||
        entry.item?.item_name ||
        entry.name ||
        "",
      variationTitle: entry.item?.variationTitle || undefined,
      image: entry.item?.image || "",
      discountedPrice: entry.item?.discountedPrice || entry.price || 0,
    },
    qty: entry.qty || 1,
    addon: entry.addon ? { title: entry.addon.title || "" } : undefined,
  }));

  const paymentBody = (
    <DoorstepPaymentWrapper
      total={grandTotal}
      options={paymentOptions}
      isLoadingOptions={isLoadingPaymentModes}
      paymentMethod={paymentMethod}
      onMethodChange={setPaymentMethod}
      isSubmitting={isSubmitting}
      isOnlineReady={Boolean(clientSecret && stripePromise)}
      onCodSubmit={async (methodType) => {
        await handleOrderSubmission(methodType);
      }}
      onOnlineSubmit={async () => {
        await handleOrderSubmission("card_online");
      }}
    />
  );

  let paymentSection = paymentBody;

  if (!selectedAddressId) {
    paymentSection = (
      <div className="rounded-2xl bg-stone-50 p-6 text-center">
        <p className="text-sm font-medium text-stone-700">
          Choose a delivery address to continue.
        </p>
        <button
          type="button"
          onClick={() => router.push("/delivery-address")}
          className="mt-4 h-11 rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-all hover:bg-red-700"
        >
          Select address
        </button>
      </div>
    );
  } else if (orderError) {
    paymentSection = (
      <PaymentErrorSection
        errorMessage={orderError}
        isInitializing={isSubmitting}
        onRetry={() => {
          setOrderError(null);
        }}
      />
    );
  } else if (paymentMethod === "card_online" && clientSecret && stripePromise) {
    paymentSection = (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#dc2626", borderRadius: "16px" },
          },
          loader: "auto",
        }}
        key={clientSecret}
      >
        {paymentBody}
      </Elements>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-10 md:py-14 lg:py-16">
        <CheckoutStepper currentStep={3} />

        <div className="grid lg:grid-cols-2 lg:items-start flex flex-col md:flex-col lg:flex-row">
          <div className="space-y-4 order-2 lg:order-1">
            <div className="bg-white overflow-hidden pr-4">
              <button
                type="button"
                onClick={() => setIsAddressCollapsed(!isAddressCollapsed)}
                className="flex w-full items-center justify-between py-6 text-left font-medium text-stone-800 lg:hidden"
              >
                <span className="flex items-center gap-2 text-sm font-medium tracking-wide text-stone-600">
                  {isAddressCollapsed ? (
                    <>
                      <ChevronDown size={22} className="text-red-600 shrink-0" />
                      <span>Show Delivery Details</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp size={22} className="text-red-600 shrink-0" />
                      <span>Hide Delivery Details</span>
                    </>
                  )}
                </span>
              </button>

              <div
                className={`grid transition-all duration-700 ease-in-out lg:block ${
                  isAddressCollapsed
                    ? "grid-rows-[0fr] opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
                    : "grid-rows-[1fr] opacity-100"
                }`}
              >
                <div className="block overflow-hidden min-h-0 px-2 py-4 lg:p-0">
                  <CheckoutForm
                    form={form}
                    setForm={setForm}
                    error={null}
                    selectedAddressId={selectedAddressId}
                  />
                </div>
              </div>
            </div>

            <section className="overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-700">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-medium tracking-wide text-stone-900">
                  <span className="h-6 w-1 rounded-full bg-red-600" />
                  Payment
                </h2>
                {isSubmitting && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Submitting order...
                  </span>
                )}
              </div>

              <div className="pr-4 py-2">{paymentSection}</div>
            </section>
          </div>

          <div className="lg:sticky lg:top-6 order-1 lg:order-2">
            <div className="bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
                className="flex w-full items-center justify-between py-4 text-left font-medium text-stone-800 lg:hidden"
              >
                <span className="flex items-center gap-2 text-sm font-medium tracking-wide text-stone-600">
                  {isSummaryCollapsed ? (
                    <>
                      <ChevronDown size={22} className="text-red-600 shrink-0" />
                      <span>Show Order Summary</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp size={22} className="text-red-600 shrink-0" />
                      <span>Hide Order Summary</span>
                    </>
                  )}
                </span>
                <span className="flex items-center gap-0.5 text-sm font-medium text-red-600">
                  <DirhamIcon size={12} className="text-red-600" />
                  {grandTotal.toFixed(2)}
                </span>
              </button>

              <div
                className={`grid transition-all duration-700 ease-in-out lg:block ${
                  isSummaryCollapsed
                    ? "grid-rows-[0fr] opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
                    : "grid-rows-[1fr] opacity-100"
                }`}
              >
                <div className="overflow-hidden min-h-0">
                  <OrderSummary
                    cart={summaryCart}
                    total={total}
                    deliveryCharge={delivery.charge}
                    vatAmount={vatAmount}
                    grandTotal={grandTotal}
                  />

                  <CustomerNote
                    note={customerNote}
                    onNoteChange={setCustomerNote}
                    onBlurSave={() => {
                      // Note is preserved in local state and sent upon submission
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAddressWarning && (
        <ConfirmDialog
          open={true}
          onClose={() => setShowAddressWarning(false)}
          onConfirm={() => {
            setShowAddressWarning(false);
            setIsAddressCollapsed(false);
            document
              .querySelector("[data-address-section]")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          title="Delivery Address Required"
          message="Please select a delivery address before proceeding to payment. We need to know where to deliver your delicious order!"
          confirmText="Select Address"
          cancelText="Cancel"
          variant="warning"
        />
      )}
    </div>
  );
};

export default CheckoutPage;
