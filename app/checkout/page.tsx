"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

import {
  useCreateSalesOrderMutation,
  useCreatePaymentIntentMutation,
  type Customer,
  type SalesOrder,
} from "../redux/api";
import type { CreateSalesOrderRequest } from "../redux/apiType";
import { readStoredCustomer } from "@/app/components/customerStorage";
import { getCustomerName } from "@/app/lib/customerPortal";
import {
  clearPendingCheckout,
  clearPendingSalesOrder,
} from "@/app/components/orderStorage";

import CheckoutStepper from "../components/Checkout/CheckoutStepper";
import CheckoutHeader from "../components/Checkout/CheckoutHeader";
import OrderSummary from "../components/Checkout/OrderSummary";
import CheckoutForm, { type DeliveryAddressItem } from "../components/Checkout/CheckoutForm";
import MobileHeader from "../components/Header/MobileHeader";
import TabletHeader from "../components/Header/TabletHeader";
import DesktopHeader from "../components/Header/DesktopHeader";
import Footer from "../components/Footer/Footer";

const stripeKey =
  
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
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
      <div className="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200">
        <PaymentElement 
          options={{ 
            layout: "tabs",
            // Explicitly request wallet payment methods
            wallets: {
              applePay: "auto",
              googlePay: "auto",
            },
          }} 
        />
      </div>

      {paymentError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-brand-700">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
          isProcessing
            ? "bg-stone-400 text-white cursor-not-allowed"
            : "bg-brand-400 text-white shadow-red-200 hover:bg-brand-700 active:scale-95"
        }`}
      >
        {isProcessing ? "Processing..." : `Pay AED ${total.toFixed(2)}`}
      </button>
    </form>
  );
};

const CheckoutPage = () => {
  const [step, setStep] = useState<2 | 3>(2);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const [form, setForm] = useState({
    phone: "",
    address: "",
    deliveryAddresses: [{ title: "Home", address: "", addressId: "" }] as DeliveryAddressItem[],
  });

  const [createSalesOrder] = useCreateSalesOrderMutation();
  const [createPaymentIntent] = useCreatePaymentIntentMutation();

  useEffect(() => {
    if (!("window" in globalThis)) return;

    const storedCustomer = readStoredCustomer();
    const cartRaw = globalThis.localStorage.getItem("cart");
    const savedPhone = globalThis.localStorage.getItem("uae_phone") || "";
    const savedAddress = globalThis.localStorage.getItem("uae_address") || "";

    const rawDelivery = globalThis.localStorage.getItem("uae_delivery_addresses");
    let savedDeliveryAddresses: DeliveryAddressItem[];
    if (rawDelivery) {
      try {
        savedDeliveryAddresses = JSON.parse(rawDelivery);
      } catch {
        savedDeliveryAddresses = [{
          title: "Home",
          address: globalThis.localStorage.getItem("uae_delivery_address") || globalThis.localStorage.getItem("uae_address") || "",
          addressId: globalThis.localStorage.getItem("uae_delivery_address_id") || globalThis.localStorage.getItem("uae_address_id") || "",
        }];
      }
    } else {
      savedDeliveryAddresses = [{
        title: "Home",
        address: globalThis.localStorage.getItem("uae_delivery_address") || globalThis.localStorage.getItem("uae_address") || "",
        addressId: globalThis.localStorage.getItem("uae_delivery_address_id") || globalThis.localStorage.getItem("uae_address_id") || "",
      }];
    }

    requestAnimationFrame(() => {
      setCustomer(storedCustomer);
      setCart(cartRaw ? JSON.parse(cartRaw) : []);
      setForm({ phone: savedPhone, address: savedAddress, deliveryAddresses: savedDeliveryAddresses });
    });
  }, []);

  useEffect(() => {
    if (form.deliveryAddresses[0]?.address && form.phone && !salesOrder && !isInitializing && cart.length > 0) {
      handleAutoProceed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.deliveryAddresses, form.phone, cart]);

  async function handleAutoProceed() {
    setIsInitializing(true);
    setOrderError(null);

    if (!cart || cart.length === 0) {
      setOrderError("No valid items in cart. Please add items before checkout.");
      setIsInitializing(false);
      return;
    }

    try {
      // Use the stable ERPNext Customer document name (= original verified phone).
      // getCustomerName() falls back to form.phone for legacy sessions.
      const customerName = customer?.name || getCustomerName() || form.phone;
      const deliveryDate = new Date().toISOString().split("T")[0];
      const primaryDeliveryAddressId = form.deliveryAddresses[0]?.addressId ||
        globalThis.localStorage.getItem("uae_delivery_address_id") ||
        globalThis.localStorage.getItem("uae_address_id") || "";

      const items = cart
        .map((cartEntry: any) => {
          const item_code = cartEntry.item?.baseItemCode || cartEntry.item?.id;
          const item_name =
            cartEntry.item?.title || cartEntry.item?.item_name || cartEntry.name;
          const qty = Number(cartEntry.qty || 1);
          const rate = Number(cartEntry.item?.discountedPrice || cartEntry.price || 0);

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
            // ERPNext field type is Small Text, so send a single comma-separated string.
            custom_selected_addons = selectedAddOnNames.join(", ");
          } else if (typeof cartEntry.addon?.title === "string") {
            const normalizedTitle = cartEntry.addon.title.trim();

            if (normalizedTitle && normalizedTitle.toLowerCase() !== "standard portion") {
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
        setOrderError("No valid items in cart. Please add items before checkout.");
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

      const intentResult = await createPaymentIntent({
        amount: total,
        currency: "aed",
        sales_order: salesOrderName,
      }).unwrap();

      setClientSecret(intentResult.client_secret);
      setStep(3);
    } catch (err: any) {
      console.error("Setup Error:", err);
      setOrderError(err?.data?.message || "Failed to initialize order.");
    } finally {
      setIsInitializing(false);
    }
  }

  const total = cart.reduce(
    (sum: number, entry: any) =>
      sum + (entry.item?.discountedPrice || 0) * (entry.qty || 1),
    0
  );

  let paymentSection: ReactNode = null;

  if (orderError) {
    paymentSection = (
      <div className="text-center py-6">
        <p className="text-brand-400 font-bold mb-4">{orderError}</p>
        <button
          onClick={handleAutoProceed}
          className="px-6 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase"
        >
          Retry Connection
        </button>
      </div>
    );
  } else if (isInitializing || !clientSecret) {
    paymentSection = (
      <div className="flex flex-col items-center py-10">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-100 border-t-brand-400 mb-4" />
        <p className="text-stone-400 font-bold uppercase text-[10px] tracking-widest">
          Securing Payment Line...
        </p>
      </div>
    );
  } else if (stripePromise && clientSecret) {
    paymentSection = (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#dc2626",
              borderRadius: "16px",
            },
          },
          // Optimize for wallet payments (Apple Pay, Google Pay, Link)
          loader: "auto",
        }}
        key={clientSecret}
      >
        <PaymentForm total={total} salesOrder={salesOrder} />
      </Elements>
    );
  }

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

        <CheckoutHeader
          title={step === 2 ? "Delivery Details" : "Secure Payment"}
          subtitle="Confirm your delivery details and complete the payment securely."
          backLabel={step === 3 ? "Change Address" : "Back to Plate"}
          backLink="/"
          onClick={
            step === 3
              ? () => {
                  setClientSecret(null);
                  setSalesOrder(null);
                  setStep(2);
                }
              : undefined
          }
        />

        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="space-y-8">
            <CheckoutForm form={form} setForm={setForm} error={null} />

            {(isInitializing || clientSecret || orderError) && (
              <section className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)] ring-1 ring-stone-100 animate-in fade-in zoom-in-95 duration-700">
                <div className="border-b border-stone-50 px-8 py-6 bg-stone-50/50">
                  <h2 className="text-xl font-medium tracking-wide text-stone-900">Payment</h2>
                </div>

                <div className="px-8 py-10">{paymentSection}</div>
              </section>
            )}
          </div>

          <div className="sticky top-24">
            <OrderSummary cart={cart} total={total} />
          </div>
        </div>
      </main>
       <Footer />
    </div>
  );
};

export default CheckoutPage;