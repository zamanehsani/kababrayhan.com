"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import {
  useCreateSalesOrderMutation,
  useCreatePaymentIntentMutation,
  useUpdateSalesOrderMutation,
  useGetCustomerAddressesQuery,
  useDeleteAddressMutation,
  useDisableAddressMutation,
  type Customer,
  type SalesOrder,
  useCompleteDoorstepOrderMutation,
} from "../redux/api";
import type { CreateSalesOrderRequest } from "../redux/apiType";
import { readStoredCustomer } from "@/app/components/customerStorage";
import {
  getCustomerName,
  saveDeliveryAddress,
  writeDeliveryAddresses,
} from "@/app/lib/customerPortal";
import {
  clearPendingCheckout,
  clearPendingSalesOrder,
} from "@/app/components/orderStorage";

import CheckoutStepper from "../components/Checkout/CheckoutStepper";
import OrderSummary from "../components/Checkout/OrderSummary";
import CheckoutForm, {
  type DeliveryAddressItem,
} from "../components/Checkout/CheckoutForm";
import MobileHeader from "../components/Header/MobileHeader";
import TabletHeader from "../components/Header/TabletHeader";
import DesktopHeader from "../components/Header/DesktopHeader";
import Footer from "../components/Footer/Footer";
import CustomerNote from "../components/Checkout/CustomerNote";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import DirhamIcon from "../components/icon/DirhamIcon";
import PaymentErrorSection from "../components/Checkout/PaymentErrorSection";
import DoorstepPaymentWrapper from "../components/Checkout/DoorstepPaymentWrapper";
import { PaymentMethodType } from "../components/Checkout/PaymentMethodSelector";
import { ChevronDown, ChevronUp } from "lucide-react";

const toDisplayAddressTitle = (
  rawTitle: string,
  addressType: string,
  index: number
) => {
  const segments = rawTitle
    .split("-")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const filteredSegments = segments.filter((segment) => {
    const normalized = segment.toLowerCase();
    return (
      !segment.startsWith("+") &&
      normalized !== addressType.toLowerCase() &&
      normalized !== "billing" &&
      normalized !== "shipping"
    );
  });

  const candidate = filteredSegments.join(" ").trim();

  if (candidate) {
    return candidate.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return index === 0 ? "Home" : `Address ${index + 1}`;
};

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: ReturnType<typeof loadStripe> | null = null;

if (stripeKey) {
  stripePromise = loadStripe(stripeKey);
} else {
  console.error(
    "Stripe publishable key is missing. Check your .env file for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
  );
}

const PaymentForm = ({
  total,
  salesOrder,
}: {
  total: number;
  salesOrder: SalesOrder | null;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const salesOrderName = salesOrder?.name?.trim();
    if (!salesOrderName) {
      setPaymentError(
        "Sales order is missing. Payment cannot continue without order tracking metadata."
      );
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setPaymentError(error.message ?? "Payment failed. Please try again.");
        setIsProcessing(false);
      } else if (paymentIntent?.status === "succeeded") {
        clearPendingCheckout();
        clearPendingSalesOrder();
        router.push("/thank-you");
      }
    } catch {
      setPaymentError("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl bg-stone-50 p-5 ring-1 ring-stone-200">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {paymentError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-xs font-black tracking-[0.2em] transition-all shadow-xl ${isProcessing
          ? "bg-stone-400 text-white cursor-not-allowed"
          : "bg-red-600 text-white shadow-red-200 hover:bg-red-700 active:scale-95"
          }`}
      >
        {isProcessing ? (
          "Processing..."
        ) : (
          <span className="flex items-center justify-center gap-0.5 normal-case">
            <span className="tracking-[0.2em] mr-1">Pay</span>
            <DirhamIcon size={14} className="text-white" />
            {total.toFixed(2)}
          </span>
        )}
      </button>
    </form>
  );
};

const CheckoutPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<2 | 3>(2);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [customerNote, setCustomerNote] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [showAddressWarning, setShowAddressWarning] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // UX Toggle features for smaller layouts
  const [isAddressCollapsed, setIsAddressCollapsed] = useState(true);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);

  const [form, setForm] = useState({
    phone: "",
    address: "",
    deliveryAddresses: [
      { title: "Home", address: "", addressId: "" },
    ] as DeliveryAddressItem[],
  });

  const [createSalesOrder] = useCreateSalesOrderMutation();
  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  const [updateSalesOrder] = useUpdateSalesOrderMutation();
  const [completeDoorstepOrder] = useCompleteDoorstepOrderMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [disableAddress] = useDisableAddressMutation();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("card_online");

  const hasInitializedPaymentRef = useRef(false);
  const noteSaveTimerRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);
  const customerName = customer?.name || getCustomerName() || form.phone;
  const { data: backendAddresses } = useGetCustomerAddressesQuery(
    customerName,
    { skip: !customerName }
  );


  const handleCustomerNoteSave = async (noteToSave: string = customerNote) => {
    const salesOrderName =
      salesOrder?.name?.trim() ||
      globalThis.localStorage.getItem("pending_sales_order") ||
      globalThis.localStorage.getItem("sales_order") ||
      "";

    if (!salesOrderName) {
      return;
    }

    try {
      await updateSalesOrder({
        salesOrderName,
        custom_customer_note: noteToSave,
      }).unwrap();
    } catch (err) {
      console.warn("Failed to update sales order note:", err);
    }
  };

  useEffect(() => {
    if (!("window" in globalThis)) return;

    const storedCustomer = readStoredCustomer();
    const cartRaw = globalThis.localStorage.getItem("cart");
    const savedPhone = globalThis.localStorage.getItem("uae_phone") || "";
    const savedAddress = globalThis.localStorage.getItem("uae_address") || "";

    const parsedCart = cartRaw ? JSON.parse(cartRaw) : [];
    if (parsedCart.length === 0) {
      router.push("/home");
      return;
    }

    const pendingSalesOrder = globalThis.localStorage.getItem(
      "pending_sales_order"
    );
    const savedClientSecret = globalThis.sessionStorage.getItem(
      "checkout_client_secret"
    );

    if (pendingSalesOrder && savedClientSecret) {
      setClientSecret(savedClientSecret);
      setStep(3);
      setSalesOrder({ name: pendingSalesOrder } as SalesOrder);
    }

    const rawDelivery = globalThis.localStorage.getItem(
      "uae_delivery_addresses"
    );
    let savedDeliveryAddresses: DeliveryAddressItem[];
    if (rawDelivery) {
      try {
        savedDeliveryAddresses = JSON.parse(rawDelivery);
      } catch {
        savedDeliveryAddresses = [
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
      }
    } else {
      savedDeliveryAddresses = [
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
    }

    requestAnimationFrame(() => {
      setCustomer(storedCustomer);
      setCart(cartRaw ? JSON.parse(cartRaw) : []);
      setForm({
        phone: savedPhone,
        address: savedAddress,
        deliveryAddresses: savedDeliveryAddresses,
      });
    });
  }, []);

  useEffect(() => {
    if (!backendAddresses) {
      return;
    }

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

    const currentSelectedId = globalThis.localStorage?.getItem("uae_delivery_address_id") || "";
    if (currentSelectedId) {
      syncedAddresses.sort((a, b) => {
        if (a.addressId === currentSelectedId) return -1;
        if (b.addressId === currentSelectedId) return 1;
        return 0;
      });
    }

    const storedDeliveryAddressesRaw = globalThis.localStorage.getItem(
      "uae_delivery_addresses"
    );
    const storedDeliveryAddresses = storedDeliveryAddressesRaw
      ? (() => {
        try {
          return JSON.parse(
            storedDeliveryAddressesRaw
          ) as DeliveryAddressItem[];
        } catch {
          return form.deliveryAddresses;
        }
      })()
      : form.deliveryAddresses;

    const currentSnapshot = JSON.stringify(
      storedDeliveryAddresses.map((item) => ({
        title: item.title,
        address: item.address,
        addressId: item.addressId,
      }))
    );
    const nextSnapshot = JSON.stringify(
      syncedAddresses.map((item) => ({
        title: item.title,
        address: item.address,
        addressId: item.addressId,
      }))
    );

    if (currentSnapshot === nextSnapshot) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      setForm((prev) => ({
        ...prev,
        deliveryAddresses: syncedAddresses,
        address: syncedAddresses[0]?.address || prev.address,
      }));

      writeDeliveryAddresses(syncedAddresses);

      if (syncedAddresses[0]) {
        saveDeliveryAddress(
          syncedAddresses[0].address,
          syncedAddresses[0].addressId
        );
      } else {
        saveDeliveryAddress("", "");
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [backendAddresses]);

  useEffect(() => {
    return () => {
      if (noteSaveTimerRef.current) {
        globalThis.clearTimeout(noteSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hasInitializedPaymentRef.current) {
      return;
    }

    if (clientSecret && salesOrder) {
      return;
    }

    if (!customerName || !cart.length || salesOrder || isInitializing) {
      return;
    }

    const primaryAddress = form.deliveryAddresses[0]?.address?.trim();
    if (!primaryAddress) {
      setShowAddressWarning(true);
      return;
    }

    hasInitializedPaymentRef.current = true;
    void handleAutoProceed();
  }, [
    customerName,
    cart.length,
    salesOrder,
    clientSecret,
    isInitializing,
    form.deliveryAddresses,
  ]);

  useEffect(() => {
    if (!salesOrder?.name || !customerNote.trim()) {
      return;
    }

    void handleCustomerNoteSave(customerNote);
  }, [salesOrder?.name]);

  async function handleAutoProceed() {
    if (isInitializing || clientSecret) {
      return;
    }

    setIsInitializing(true);
    setOrderError(null);

    if (!cart || cart.length === 0) {
      router.push("/home");
      return;
    }

    const currentSelectedId = globalThis.localStorage?.getItem("uae_delivery_address_id") || "";
    const selectedAddressObj = form.deliveryAddresses.find(a => a.addressId === currentSelectedId) || form.deliveryAddresses[0];
    const primaryAddress = selectedAddressObj?.address?.trim();
    if (!primaryAddress) {
      setOrderError("Please select a delivery address before proceeding.");
      setIsInitializing(false);
      setShowAddressWarning(true);
      return;
    }

    try {
      const customerName = customer?.name || getCustomerName() || form.phone;
      const deliveryDate = new Date().toISOString().split("T")[0];
      const explicitSelectedId =
        globalThis.localStorage?.getItem("uae_delivery_address_id") ||
        globalThis.localStorage?.getItem("uae_address_id") ||
        "";

      const primaryDeliveryAddressId = explicitSelectedId || form.deliveryAddresses[0]?.addressId || "";

      const items = cart
        .map((cartEntry: any) => {
          const item_code = cartEntry.item?.baseItemCode || cartEntry.item?.id;
          const item_name =
            cartEntry.item?.title ||
            cartEntry.item?.item_name ||
            cartEntry.name;
          const qty = Number(cartEntry.qty || 1);
          const rate = Number(
            cartEntry.item?.discountedPrice || cartEntry.price || 0
          );

          const selectedAddOns = Array.isArray(cartEntry.addon?.selectedAddOns)
            ? cartEntry.addon.selectedAddOns
            : [];
          const selectedAddOnNames = selectedAddOns
            .map((addOn: { name?: unknown }) =>
              typeof addOn.name === "string" ? addOn.name.trim() : ""
            )
            .filter((name: string) => Boolean(name));

          let custom_selected_addons = "";

          if (selectedAddOnNames.length > 0) {
            custom_selected_addons = selectedAddOnNames.join(", ");
          } else if (typeof cartEntry.addon?.title === "string") {
            const normalizedTitle = cartEntry.addon.title.trim();

            if (
              normalizedTitle &&
              normalizedTitle.toLowerCase() !== "standard portion"
            ) {
              custom_selected_addons = normalizedTitle
                .split(",")
                .map((name: string) => name.trim())
                .filter((name: string) => Boolean(name))
                .join(", ");
            }
          }

          if (!item_code) return null;

          return {
            item_code,
            item_name,
            qty,
            rate,
            amount: rate * qty,
            warehouse: "Finished Goods - P",
            delivery_date: deliveryDate,
            uom: "Nos",
            custom_selected_addons,
            is_free_item: 0 as const,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (!items.length) {
        setOrderError(
          "No valid items in cart. Please add items before checkout."
        );
        setIsInitializing(false);
        return;
      }

      const orderPayload = {
        doctype: "Sales Order",
        customer: customerName,
        transaction_date: deliveryDate,
        delivery_date: deliveryDate,
        company: "Kabab Al Rayhan",
        selling_price_list: "Standard Selling",
        currency: "AED",
        price_list_currency: "AED",
        conversion_rate: 1,
        plc_conversion_rate: 1,
        customer_address: primaryDeliveryAddressId || undefined,
        shipping_address_name: primaryDeliveryAddressId || undefined,
        custom_customer_note: customerNote,
        taxes_and_charges: "Food Tax 5%",
        taxes: [
          {
            charge_type: "On Net Total",
            account_head: "Food Tax 5% - P",
            description: "VAT 5%",
            rate: 5,
            included_in_print_rate: 1 as const,
          },
        ],
        items,
      } satisfies CreateSalesOrderRequest;

      const order = await createSalesOrder(orderPayload).unwrap();
      const salesOrderName = order?.name?.trim();

      if (!salesOrderName) {
        setOrderError("Order creation failed. No order name returned.");
        setIsInitializing(false);
        return;
      }

      setSalesOrder(order);
      if (salesOrderName && globalThis.localStorage) {
        globalThis.localStorage.setItem("pending_sales_order", salesOrderName);
        globalThis.localStorage.setItem("sales_order", salesOrderName);
      }

      const intentResult = await createPaymentIntent({
        amount: total,
        currency: "aed",
        sales_order: salesOrderName,
      }).unwrap();

      setClientSecret(intentResult.client_secret);
      if (globalThis.sessionStorage) {
        globalThis.sessionStorage.setItem(
          "checkout_client_secret",
          intentResult.client_secret
        );
      }
      setStep(3);
      setRetryCount(0);
    } catch (err: any) {
      console.error("Setup Error:", err);
      const errorMessage =
        err?.data?.message || "Failed to initialize order. Please try again.";
      setOrderError(errorMessage);

      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setIsInitializing(false);
    }
  }



  const scheduleCustomerNoteSave = (nextNote: string) => {
    if (noteSaveTimerRef.current) {
      globalThis.clearTimeout(noteSaveTimerRef.current);
    }

    noteSaveTimerRef.current = globalThis.setTimeout(() => {
      void handleCustomerNoteSave(nextNote);
    }, 700);
  };

  const total = cart.reduce(
    (sum: number, entry: any) =>
      sum + (entry.item?.discountedPrice || 0) * (entry.qty || 1),
    0
  );

  let paymentSection: ReactNode = null;

  if (orderError) {
    paymentSection = (
      <PaymentErrorSection
        errorMessage={orderError}
        isInitializing={isInitializing}
        onRetry={() => {
          hasInitializedPaymentRef.current = false;
          setOrderError(null);
          handleAutoProceed();
        }}
      />
    );
  } else {
    paymentSection = (
      <div className="space-y-2">
        {isInitializing || (!clientSecret && paymentMethod === "card_online") ? (
          <div className="flex flex-col items-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-100 border-t-red-600 mb-3" />
            <p className="text-stone-400 font-bold text-[9px] tracking-widest">
              Securing Payment Line...
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {stripePromise && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: clientSecret || undefined,
                  appearance: {
                    theme: "stripe",
                    variables: { colorPrimary: "#dc2626", borderRadius: "16px" },
                  },
                  loader: "auto",
                }}
                key={clientSecret || "doorstep-active"}
              >
                <DoorstepPaymentWrapper
                  clientSecret={clientSecret || ""}
                  total={total}
                  salesOrder={salesOrder}
                  onBack={() => setStep(2)}
                  onSuccess={() => {
                    clearPendingCheckout();
                    clearPendingSalesOrder();
                    router.push("/thank-you");
                  }}
                  onCodSubmit={async (methodType, details) => {
                    try {
                      const orderName = salesOrder?.name;
                      if (!orderName) throw new Error("Missing sales order name");

                      await completeDoorstepOrder({
                        salesOrderName: orderName,
                        paymentMethod: methodType,
                        changeRequired: details?.changeRequired || "Exact Amount"
                      }).unwrap();
                      clearPendingCheckout();
                      clearPendingSalesOrder();
                      router.push("/thank-you");
                    } catch (err) {
                      console.error("Fulfillment selection update failed:", err);
                    }
                  }}
                />
              </Elements>
            )}
          </div>
        )}
      </div>
    );
  }

  const selectedAddressId = globalThis.localStorage?.getItem("uae_delivery_address_id") ||
    globalThis.localStorage?.getItem("uae_address_id") ||
    "";

  return (
    <div className="min-h-screen bg-white">
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      <div className="hidden md:block lg:hidden">
        <TabletHeader />
      </div>

      <div className="hidden lg:block">
        <DesktopHeader />
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:py-14 lg:py-16">
        <CheckoutStepper currentStep={step} />

        <div className="grid  lg:grid-cols-2 lg:items-start flex flex-col md:flex-col lg:flex-row">

          {/* Left Section (Form & Payment) - Appears SECOND on mobile/tablet, FIRST on desktop */}
          <div className="space-y-4 order-2 lg:order-1">

            {/* COLLAPSIBLE DELIVERY ADDRESS BLOCK */}
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

                <span className="text-xs font-normal text-stone-400">
                  {form.deliveryAddresses[0]?.title || "Active Address"}
                </span>
              </button>

              {/* Outer Grid Wrapper (Controls the animation) */}
              <div
                className={`grid transition-all duration-700 ease-in-out lg:block ${isAddressCollapsed
                  ? "grid-rows-[0fr] opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
                  : "grid-rows-[1fr] opacity-100"
                  }`}
              >
                {/* Inner Child Wrapper (Must use unconditional block/overflow-hidden for grid track calculation) */}
                <div className="block overflow-hidden min-h-0 px-2 py-4 lg:p-0">
                  <CheckoutForm form={form} setForm={setForm} error={null} selectedAddressId={selectedAddressId} />
                </div>
              </div>
            </div>

            {/* PAYMENT COMPONENT (Always explicitly visible) */}
            {(isInitializing || clientSecret || orderError) && (
              <section className="overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-700">
                <div className="px-2">
                  <h2 className=" flex items-center gap-3 text-xl font-medium tracking-wide text-stone-900">
                    <span className="h-6 w-1 rounded-full bg-red-600" />
                    Payment
                  </h2>
                </div>

                <div className="pr-4 py-6">{paymentSection}</div>
              </section>
            )}
          </div>

          {/* Right Section (Order Summary & Note) - Appears FIRST on mobile/tablet, SECOND on desktop */}
          <div className="lg:sticky lg:top-6 order-1 lg:order-2">

            {/* COLLAPSIBLE ORDER SUMMARY & NOTES BLOCK */}
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
                  {total.toFixed(2)}
                </span>
              </button>

              {/* Smooth Height Transition Wrapper */}
              <div
                className={`grid transition-all duration-700 ease-in-out lg:block ${isSummaryCollapsed
                    ? "grid-rows-[0fr] opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
                    : "grid-rows-[1fr] opacity-100"
                  }`}
              >
                <div className="overflow-hidden min-h-0">
                  <OrderSummary cart={cart} total={total} />

                  <CustomerNote
                    note={customerNote}
                    onNoteChange={(value) => {
                      setCustomerNote(value);
                      scheduleCustomerNoteSave(value);
                    }}
                    onBlurSave={() => {
                      void handleCustomerNoteSave(customerNote);
                    }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Address Warning Dialog */}
      {showAddressWarning && (
        <ConfirmDialog
          open={true}
          onClose={() => setShowAddressWarning(false)}
          onConfirm={() => {
            setShowAddressWarning(false);
            setIsAddressCollapsed(false); // Auto-expand when warning prompts action
            const addressSection = document.querySelector(
              "[data-address-section]"
            );
            addressSection?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }}
          title="Delivery Address Required"
          message="Please select a delivery address before proceeding to payment. We need to know where to deliver your delicious order!"
          confirmText="Select Address"
          cancelText="Cancel"
          variant="warning"
        />
      )}

      <Footer />
    </div>
  );
};

export default CheckoutPage;
