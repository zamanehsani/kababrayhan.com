"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/home/BottomNav";
import {
  CUSTOMER_PORTAL_UPDATED,
  clearCustomerPortalSession,
  type DeliveryAddressItem,
  PHONE_KEY,
  getCustomerName,
  readCustomerPortalSnapshot,
  saveDeliveryAddress,
  writeDeliveryAddresses,
} from "@/app/lib/customerPortal";
import {
  useGetCustomerAddressesQuery,
  useGetCustomerQuery,
  useGetCustomersByMobileNumberQuery,
  useGetCustomerSalesOrdersQuery,
} from "@/app/redux/api";
import { useLogoutMutation } from "@/app/redux/authApi";
import type { CustomerDetails } from "@/app/redux/apiType";
import { saveStoredCustomer } from "@/app/components/customerStorage";
import AddressesTab from "@/app/account-profile/components/AddressesTab";
import OrdersTab from "@/app/account-profile/components/OrdersTab";
import ProfileTab from "@/app/account-profile/components/ProfileTab";


// Robust recursive string utility to strip out prefixes and format titles beautifully
const extractFriendlyTitle = (addressTitle?: string, phone?: string) => {
  if (!addressTitle) return "";

  let clean = addressTitle.trim();

  // Recursively strip out the phone number prefix if it exists
  if (phone) {
    const formattedPhone = phone.trim();
    while (clean.startsWith(formattedPhone)) {
      clean = clean.slice(formattedPhone.length).replace(/^-/, "");
    }
    const phoneNoPlus = formattedPhone.replace("+", "");
    while (clean.startsWith(phoneNoPlus)) {
      clean = clean.slice(phoneNoPlus.length).replace(/^-/, "");
    }
  }

  // Replace lingering dashes with spaces
  clean = clean.replace(/-/g, " ").trim();

  // Capitalize nicely for premium UI layout presentation
  if (clean) {
    return clean.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return "";
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

type ERPNextAddress = {
  name: string;
  address_title?: string;
  address_type?: string;
  address_line1?: string;
  address_line2?: string;
  is_shipping_address?: number | string;
  is_primary_address?: number | string;
  custom_latitude?: string;
  custom_longitude?: string;
};

export default function AccountProfilePage() {
  const router = useRouter();
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );
  const isSyncingFromBackendRef = useRef(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [logout] = useLogoutMutation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders">(
    "profile"
  );

  // Fetch customer and order data from ERPNext backend
  const storedCustomerName = getCustomerName();
  const phoneNumber =
    typeof window === "undefined"
      ? ""
      : globalThis.localStorage.getItem(PHONE_KEY) || "";
  const { data: customersByMobileNumber } = useGetCustomersByMobileNumberQuery(
    phoneNumber,
    { skip: !phoneNumber }
  );

  const customerName =
    customersByMobileNumber?.[0]?.name || storedCustomerName || phoneNumber;
  const {
    data: customerProfile,
    refetch: refetchCustomer,
  } = useGetCustomerQuery(customerName, {
    skip: !customerName,
  });
  const {
    data: backendAddresses,
    isLoading: isLoadingAddresses,
    refetch: refetchAddresses,
  } = useGetCustomerAddressesQuery(customerName, {
    skip: !customerName || !portalState.isVerified,
  });

  const { data: customerOrdersData } = useGetCustomerSalesOrdersQuery(
    customerName || "",
    {
      skip: !customerName || !portalState.isVerified,
    }
  );
  const customerOrders = customerOrdersData ?? [];

  useEffect(() => {
    const matchedCustomer = customersByMobileNumber?.[0];
    if (matchedCustomer) {
      saveStoredCustomer(matchedCustomer);
    }

    //reconstruct the addresses state from the store and to the actions like remove, edit and creating, listing as standard, then while checkout process, first create and complete the  frontend address as per the 

    if (!customerProfile && !backendAddresses && !customerOrdersData) {
      return;
    }
  }, [
    backendAddresses,
    customerName,
    customerOrdersData,
    customerProfile,
    customersByMobileNumber,
    phoneNumber,
  ]);

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  useEffect(() => {
    if (!backendAddresses || isSyncingFromBackendRef.current) {
      return;
    }

    // Prevent race condition: don't overwrite during active user mutations
    const syncedAddresses: DeliveryAddressItem[] = backendAddresses.map(
      (address: ERPNextAddress, index: number) => ({
        id: address.name,
        title:
          extractFriendlyTitle(address.address_title, portalState.phone) ||
          address.address_type ||
          (index === 0 ? "Home" : `Address ${index + 1}`),
        address: [address.address_line1, address.address_line2]
          .filter(Boolean)
          .join(", "),
        addressId: address.name,
        // Track underlying functional data parameters locally
        isDelivery:
          address.is_shipping_address === 1 ||
          address.is_shipping_address === "1",
        isBilling:
          address.is_primary_address === 1 ||
          address.is_primary_address === "1",
        latitude: address.custom_latitude,
        longitude: address.custom_longitude,
      })
    );

    const latestPortalState = readCustomerPortalSnapshot();
    const currentSnapshot = JSON.stringify(
      latestPortalState.deliveryAddresses.map((item) => ({
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

    isSyncingFromBackendRef.current = true;
    
    writeDeliveryAddresses(syncedAddresses);

    if (syncedAddresses[0]) {
      saveDeliveryAddress(
        syncedAddresses[0].address,
        syncedAddresses[0].addressId
      );
    } else {
      saveDeliveryAddress("", "");
    }

    setTimeout(() => { isSyncingFromBackendRef.current = false; }, 100);
  }, [
    backendAddresses,
    portalState.phone,
  ]);

  useEffect(() => {
    globalThis.addEventListener(CUSTOMER_PORTAL_UPDATED, refreshPortalState);
    globalThis.addEventListener("storage", refreshPortalState);

    return () => {
      globalThis.removeEventListener(
        CUSTOMER_PORTAL_UPDATED,
        refreshPortalState
      );
      globalThis.removeEventListener("storage", refreshPortalState);
    };
  }, [refreshPortalState]);

  const handleSignOut = async () => {
    const mobile = (portalState.phone || localStorage.getItem(PHONE_KEY) || "").trim();

    clearCustomerPortalSession();

    try {
      if (mobile) {
        await logout({ mobile }).unwrap();
      }
    } catch (error) {
      console.error("Logout failed", error);
    }

    router.push("/");
  };

  const profilePhone =
    customerProfile?.mobile_number ||
    customerProfile?.mobile_no ||
    portalState.phone ||
    "Not verified yet";

  const menuItems: Array<{ key: "profile" | "addresses" | "orders"; label: string }> = [
    { key: "profile", label: "Profile" },
    { key: "addresses", label: "Addresses" },
    { key: "orders", label: "Order History" },
  ];

  return (
    <>
      <main className="flex flex-1 flex-col bg-slate-50 font-sans text-slate-900">


        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-3 sm:px-6 lg:px-8 lg:py-5">
          {feedback && (
            <div
              className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 min-w-80 max-w-md rounded-2xl border-2 px-6 py-4 shadow-2xl animate-in slide-in-from-top-4 duration-300 ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <p className="text-center text-sm font-semibold">{feedback.message}</p>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-600"
            >
              <Menu size={16} />
              Menu
            </button>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
              {menuItems.find((item) => item.key === activeTab)?.label}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden h-fit self-start rounded-3xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40 md:block">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveTab(item.key)}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all ${
                        isActive
                          ? "bg-red-50 text-red-700 shadow-sm ring-1 ring-red-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                      )}
                    </button>
                  );
                })}
                <div className="my-1.5 h-px bg-slate-100" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </nav>
            </aside>

            <div className="space-y-6">
              {activeTab === "profile" && (
                <ProfileTab
                  customerProfile={customerProfile}
                  profilePhone={profilePhone}
                  customerName={customerName}
                  portalPhone={portalState.phone}
                  onRefetchCustomer={async () => {
                    const result = await refetchCustomer();
                    return "data" in result
                      ? (result.data as CustomerDetails | undefined)
                      : undefined;
                  }}
                  onRefresh={refreshPortalState}
                  onFeedback={(nextFeedback: { type: "success" | "error"; message: string }) => {
                    setFeedback(nextFeedback);
                    setTimeout(() => setFeedback(null), 3000);
                  }}
                  onRefetchAddresses={refetchAddresses}
                />
              )}

              {activeTab === "addresses" && (
                <AddressesTab
                  addresses={portalState.deliveryAddresses}
                  isLoading={isLoadingAddresses}
                  profilePhone={profilePhone}
                  onRefresh={refreshPortalState}
                />
              )}

              {activeTab === "orders" && (
                <OrdersTab
                  orders={customerOrders}
                  formatCurrency={formatCurrency}
                />
              )}
              </div>
            </div>

        </section>

        <BottomNav />
      </main>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[70] bg-slate-900/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="h-full w-[68%] max-w-[260px] bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">Menu</p>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const isActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all ${
                      isActive
                        ? "bg-red-50 text-red-700 shadow-sm ring-1 ring-red-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                    )}
                  </button>
                );
              })}
              <div className="my-1.5 h-px bg-slate-100" />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>
        </div>
      )}

    </>
  );
}

