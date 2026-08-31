"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import {
  useCreateSalesOrderMutation,
  useCreatePaymentIntentMutation,
  useUpdateSalesOrderMutation,
  useGetCustomerAddressesQuery,
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
import CustomerNote from "../components/Checkout/CustomerNote";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import DirhamIcon from "../components/icon/DirhamIcon";
import PaymentErrorSection from "../components/Checkout/PaymentErrorSection";
import DoorstepPaymentWrapper from "../components/Checkout/DoorstepPaymentWrapper";
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

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  process.env.STRIPE_PUBLISHABLE_KEY;
let stripePromise: ReturnType<typeof loadStripe> | null = null;

if (stripeKey) {
  stripePromise = loadStripe(stripeKey);
} else {
  console.error(
    "Stripe publishable key is missing. Check your .env file for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
  );
}

interface CartItem {
  item: {
    baseItemCode?: string;
    id?: string;
    title?: string;
    item_name?: string;
    baseTitle?: string;
    variationTitle?: string;
    variation?: {
      id?: string;
      title?: string;
      name?: string;
      optionId?: string;
    } | null;
    baseItem?: {
      itemCode?: string;
      id?: string | number;
      name?: string;
      title?: string;
    } | null;
    discountedPrice?: number;
    price?: number;
    image?: string;
  };
  qty?: number;
  name?: string;
  price?: number;
  addon?: {
    selectedAddOns?: Array<{ name?: string }>;
    title?: string;
  };
}

const CheckoutPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<2 | 3>(() => {
    if (typeof window === "undefined") {
      return 2;
    }

    const pendingSalesOrder = globalThis.localStorage.getItem("pending_sales_order");
    const savedClientSecret = globalThis.sessionStorage.getItem("checkout_client_secret");

    return pendingSalesOrder && savedClientSecret ? 3 : 2;
  });
  const [customer, setCustomer] = useState<Customer | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return readStoredCustomer();
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const cartRaw = globalThis.localStorage.getItem("cart");
    return cartRaw ? JSON.parse(cartRaw) : [];
  });
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const pendingSalesOrder = globalThis.localStorage.getItem("pending_sales_order");
    const savedClientSecret = globalThis.sessionStorage.getItem("checkout_client_secret");

    if (pendingSalesOrder && savedClientSecret) {
      return { name: pendingSalesOrder } as SalesOrder;
    }

    return null;
  });
  const [clientSecret, setClientSecret] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return globalThis.sessionStorage.getItem("checkout_client_secret");
  });
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [customerNote, setCustomerNote] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [showAddressWarning, setShowAddressWarning] = useState(false);
  const [deliveryZone] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return globalThis.localStorage.getItem("uae_delivery_zone") || "";
  });
  const [deliveryCharge] = useState<number>(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    return parseFloat(globalThis.localStorage.getItem("uae_delivery_charge") || "0");
  });

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

  const hasInitializedPaymentRef = useRef(false);
  const customerName = customer?.name || getCustomerName() || form.phone;
  const { data: backendAddresses } = useGetCustomerAddressesQuery(
    customerName,
    { skip: !customerName }
  );


  const handleCustomerNoteSave = useCallback(
    async (noteToSave: string = customerNote) => {
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
    },
    [customerNote, salesOrder?.name, updateSalesOrder]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cartRaw = globalThis.localStorage.getItem("cart");
    const parsedCart = cartRaw ? JSON.parse(cartRaw) : [];

    if (parsedCart.length === 0) {
      router.push("/");
      return;
    }

    const savedPhone = globalThis.localStorage.getItem("uae_phone") || "";
    const savedAddress = globalThis.localStorage.getItem("uae_address") || "";
    const rawDelivery = globalThis.localStorage.getItem("uae_delivery_addresses");

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

    const frameId = requestAnimationFrame(() => {
      setCustomer(readStoredCustomer());
      setCart(parsedCart);
      setForm({
        phone: savedPhone,
        address: savedAddress,
        deliveryAddresses: savedDeliveryAddresses,
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [router]);

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
  }, [backendAddresses, form.deliveryAddresses]);

  const total = cart.reduce(
    (sum: number, entry: CartItem) =>
      sum + (entry.item?.discountedPrice || 0) * (entry.qty || 1),
    0
  );
  const grandTotal = total + deliveryCharge;

  const handleAutoProceed = useCallback(async () => {
    if (isInitializing || clientSecret) {
      return;
    }

    setIsInitializing(true);
    setOrderError(null);

    if (!cart || cart.length === 0) {
      router.push("/");
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
        .map((cartEntry: CartItem) => {
          const item_code = cartEntry.item?.baseItemCode || cartEntry.item?.id;
          const item_name =
            cartEntry.item?.variationTitle && cartEntry.item?.baseTitle
              ? `${cartEntry.item.baseTitle} - ${cartEntry.item.variationTitle}`
              : cartEntry.item?.title ||
                cartEntry.item?.item_name ||
                cartEntry.item?.baseItem?.name ||
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

      // Read the latest zone/charge from localStorage at order time in case
      // the user changed their address after the initial component mount.
      const latestDeliveryZone =
        globalThis.localStorage?.getItem("uae_delivery_zone") || deliveryZone;
      const latestDeliveryCharge =
        parseFloat(globalThis.localStorage?.getItem("uae_delivery_charge") ?? "0") || deliveryCharge;
      const latestGrandTotal = total + latestDeliveryCharge;

      const orderPayload = {
        doctype: "Sales Order",
        customer: customerName,
        transaction_date: deliveryDate,
        delivery_date: deliveryDate,
        company: process.env.NEXT_PUBLIC_ERP_COMPANY_NAME || "Kabab Al Rayhan",
        selling_price_list: "Standard Selling",
        currency: "AED",
        // order_type: orderType,
        price_list_currency: "AED",
        conversion_rate: 1,
        plc_conversion_rate: 1,
        customer_address: primaryDeliveryAddressId || undefined,
        shipping_address_name: primaryDeliveryAddressId || undefined,
        custom_customer_note: customerNote,
        custom_delivery_zone: latestDeliveryZone || undefined,
        custom_delivery_charge: latestDeliveryCharge || undefined,
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
        amount: latestGrandTotal,
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
    } catch (err: unknown) {
      console.error("Setup Error:", err);
      const errorMessage =
        (typeof err === "object" && err !== null && "data" in err &&
          typeof (err as { data?: { message?: string } }).data?.message === "string"
          ? (err as { data?: { message?: string } }).data?.message
          : undefined) || "Failed to initialize order. Please try again.";
      setOrderError(errorMessage);

      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [
    cart,
    clientSecret,
    createPaymentIntent,
    createSalesOrder,
    customer,
    customerNote,
    deliveryCharge,
    deliveryZone,
    form.deliveryAddresses,
    form.phone,
    isInitializing,
    retryCount,
    router,
    total,
  ]);

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
      return;
    }

    hasInitializedPaymentRef.current = true;
    const frameId = requestAnimationFrame(() => {
      void handleAutoProceed();
    });

    return () => cancelAnimationFrame(frameId);
  }, [
    customerName,
    cart.length,
    salesOrder,
    clientSecret,
    isInitializing,
    form.deliveryAddresses,
    handleAutoProceed,
  ]);

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
        {isInitializing || !clientSecret ? (
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
                  total={grandTotal}
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

  

  return (
    <div className="min-h-screen bg-white">
      

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
                <div className="">
                  <h2 className=" flex items-center gap-3 text-xl font-medium tracking-wide text-stone-900">
                    <span className="h-6 w-1 rounded-full bg-red-600" />
                    Payment
                  </h2>
                </div>

                <div className="pr-4 py-2">{paymentSection}</div>
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
                  {grandTotal.toFixed(2)}
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
                  <OrderSummary cart={summaryCart} total={total} deliveryCharge={deliveryCharge} />

                  <CustomerNote
                    note={customerNote}
                    onNoteChange={(value) => {
                      setCustomerNote(value);
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
    </div>
  );
};

export default CheckoutPage;
