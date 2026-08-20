"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CreditCard, LogOut, MapPin, Menu, Package, ReceiptText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import MobileHeader from "../components/Header/MobileHeader";
import TabletHeader from "../components/Header/TabletHeader";
import DesktopHeader from "../components/Header/DesktopHeader";
import BottomNav from "../components/home/BottomNav";
import CartSidebarWidget from "../components/Cart/CartSidebarWidget";
import PhoneModal from "../components/home/modal/PhoneModal";
import PhoneVerifyModal from "../components/home/modal/PhoneVerifyModal";
import AddressSelectModal, {
  type SelectedAddress,
} from "../components/home/modal/AddressSelectModal";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import {
  CUSTOMER_PORTAL_UPDATED,
  clearCustomerPortalSession,
  type DeliveryAddressItem,
  PHONE_KEY,
  PHONE_STATUS_KEY,
  dispatchCustomerPortalUpdated,
  getCustomerName,
  initializeCustomerPortalSession,
  readCustomerPortalSnapshot,
  saveDeliveryAddress,
  saveVerifiedPhone,
  writeDeliveryAddresses,
} from "@/app/lib/customerPortal";
import {
  useDeleteAddressMutation,
  useGetCustomerAddressesQuery,
  useDisableAddressMutation,
  useGetCustomerQuery,
  useGetCustomerSalesOrdersQuery,
  useGetSalesOrderQuery,
  useSetCustomerInfoMutation,
} from "@/app/redux/api";
import { useLogoutMutation } from "@/app/redux/authApi";
import Footer from "../components/Footer/Footer";
import AddressesTab from "./components/AddressesTab";
import OrdersTab from "./components/OrdersTab";
import ProfileTab from "./components/ProfileTab";


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
};

export default function AccountProfilePage() {
  const router = useRouter();
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState<number | null>(
    null
  );
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [previousVerifiedPhone, setPreviousVerifiedPhone] = useState("");
  const isSyncingFromBackendRef = useRef(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    index: number;
    label: string;
  } | null>(null);
  const [setCustomerInfo] = useSetCustomerInfoMutation();
  const [logout] = useLogoutMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [disableAddress] = useDisableAddressMutation();

  const [emailEditorOpen, setEmailEditorOpen] = useState(false);
  const [pendingEmailValue, setPendingEmailValue] = useState("");
  const [selectedOrderName, setSelectedOrderName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders">(
    "profile"
  );

  // Fetch customer and order data from ERPNext backend
  const customerName = getCustomerName();
  const { data: customerProfile } = useGetCustomerQuery(customerName || "", {
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

  const { data: selectedOrderDetails } = useGetSalesOrderQuery(
    selectedOrderName || "",
    {
      skip: !selectedOrderName,
    }
  );

  useEffect(() => {
    if (!customerProfile && !backendAddresses && !customerOrdersData) {
      return;
    }

    console.groupCollapsed("[Frappe] Account profile data");
    console.log("Customer details:", customerProfile);
    console.log("Customer name fields:", {
      firstName: customerProfile?.first_name,
      lastName: customerProfile?.last_name,
      customerName: customerProfile?.customer_name,
    });
    console.log("Customer contact fields:", {
      mobileNo: customerProfile?.mobile_no,
      emailId: customerProfile?.email_id,
    });
    console.log("Addresses:", backendAddresses);
    console.log("Orders:", customerOrdersData);
    console.groupEnd();
  }, [backendAddresses, customerOrdersData, customerProfile]);

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  useEffect(() => {
    if (!backendAddresses || isSyncingFromBackendRef.current) {
      return;
    }

    // Prevent race condition: don't overwrite during active user mutations
    if (deletingIndex !== null) {
      return;
    }

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
    deletingIndex,
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

  const handleOpenPhoneUpdate = () => {
    setPreviousVerifiedPhone(portalState.isVerified ? portalState.phone : "");
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(PHONE_STATUS_KEY);
    setShowPhoneModal(true);
  };

  const handlePhoneModalClose = (phoneJustSaved?: string) => {
    setShowPhoneModal(false);

    if (!phoneJustSaved) {
      refreshPortalState();
      return;
    }

    setPhoneForVerify(phoneJustSaved);
    setShowVerifyModal(true);
  };

  const handleVerifyModalClose = () => {
    setShowVerifyModal(false);

    const status = globalThis.localStorage.getItem(PHONE_STATUS_KEY);
    if (status === "verified") {
      const newPhone = globalThis.localStorage.getItem(PHONE_KEY) || "";
      const customerName = getCustomerName();

      if (pendingEmailValue && customerName) {
        setCustomerInfo({
          customerName,
          fieldname: "email_id",
          value: pendingEmailValue,
        })
          .then(() => {
            setFeedback({
              type: "success",
              message: "Email updated successfully.",
            });
            setTimeout(() => setFeedback(null), 3000);
            setPendingEmailValue("");
          })
          .catch((err: unknown) => {
            console.warn("Failed to update customer email_id:", err);
            setFeedback({
              type: "error",
              message: "Failed to update email. Please try again.",
            });
            setTimeout(() => setFeedback(null), 3000);
          });
      }

      if (customerName && newPhone && customerName !== newPhone) {
        setCustomerInfo({
          customerName,
          fieldname: "mobile_no",
          value: newPhone,
        }).catch((err: unknown) =>
          console.warn("Failed to update customer mobile_no:", err)
        );
      }
      refreshPortalState();
      refetchAddresses();
      return;
    }

    if (previousVerifiedPhone) {
      saveVerifiedPhone(previousVerifiedPhone);
    } else {
      globalThis.localStorage.removeItem(PHONE_KEY);
      globalThis.localStorage.removeItem(PHONE_STATUS_KEY);
      initializeCustomerPortalSession();
      dispatchCustomerPortalUpdated();
    }

    refreshPortalState();
  };

  const handleChangePhoneFromVerify = () => {
    setShowVerifyModal(false);
    setPhoneForVerify("");
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(PHONE_STATUS_KEY);
    setShowPhoneModal(true);
  };

  const handleAddressSelect = (addressData: SelectedAddress) => {
    if (activeDeliveryIndex === null) return;

    const resolvedAddress = addressData.name || "";
    const addressId = addressData.id;

    const updatedAddresses = portalState.deliveryAddresses.map((da, i) =>
      i === activeDeliveryIndex
        ? { ...da, address: resolvedAddress, addressId }
        : da
    );

    writeDeliveryAddresses(updatedAddresses);

    if (activeDeliveryIndex === 0) {
      saveDeliveryAddress(resolvedAddress, addressId);
    }

    refreshPortalState();
    setActiveDeliveryIndex(null);
  };

  const handleAddNewAddress = () => {
    const newAddress: DeliveryAddressItem = {
      id: String(Date.now()),
      title: "",
      address: "",
      addressId: "",
    };
    const updatedAddresses = [...portalState.deliveryAddresses, newAddress];
    writeDeliveryAddresses(updatedAddresses);
    refreshPortalState();
    setActiveDeliveryIndex(updatedAddresses.length - 1);
  };

  const handleRemoveAddress = async () => {
    if (!confirmDelete) return;

    const indexToRemove = confirmDelete.index;
    const addressToRemove = portalState.deliveryAddresses[indexToRemove];
    if (!addressToRemove) return;

    setConfirmDelete(null);
    setDeletingIndex(indexToRemove);

    type AddressDeleteError = {
      data?: {
        _server_messages?: string;
        exception?: string;
        message?: string;
      };
      message?: string;
    };

    let isFallbackDisable = false;

    if (addressToRemove.addressId) {
      try {
        await deleteAddress(addressToRemove.addressId).unwrap();
      } catch (err: unknown) {
        const errorData =
          typeof err === "object" && err !== null && "data" in err
            ? ((err as AddressDeleteError).data ?? undefined)
            : undefined;

        const serverMessages = String(
          errorData?._server_messages ||
            errorData?.exception ||
            errorData?.message ||
            (typeof err === "object" && err !== null && "message" in err
              ? (err as AddressDeleteError).message || ""
              : "") ||
            ""
        ).toLowerCase();

        // Detect if address is linked to other documents (sales order, etc.)
        const isLinkedError =
          serverMessages.includes("linkexistserror") ||
          serverMessages.includes("link exists") ||
          serverMessages.includes("linked") ||
          serverMessages.includes("cannot delete");

        if (isLinkedError) {
          // Address is linked to other documents, disable instead of delete
          try {
            await disableAddress(addressToRemove.addressId).unwrap();
            isFallbackDisable = true;
          } catch (disableErr) {
            console.warn(
              "Failed to disable linked address:",
              disableErr
            );
            setFeedback({
              type: "error",
              message: "Address is in use and cannot be removed. Please try again.",
            });
            setTimeout(() => setFeedback(null), 4000);
            setDeletingIndex(null);
            return;
          }
        } else {
          console.warn("Failed to delete address:", err);
          setFeedback({
            type: "error",
            message: "Failed to remove address. Please try again.",
          });
          setTimeout(() => setFeedback(null), 4000);
          setDeletingIndex(null);
          return;
        }
      }
    }

    const updatedAddresses = portalState.deliveryAddresses.filter(
      (_, i) => i !== indexToRemove
    );
    writeDeliveryAddresses(updatedAddresses);

    if (indexToRemove === 0) {
      if (updatedAddresses[0]) {
        saveDeliveryAddress(
          updatedAddresses[0].address,
          updatedAddresses[0].addressId
        );
      } else {
        saveDeliveryAddress("", "");
      }
    }

    setFeedback({
      type: "success",
      message: isFallbackDisable
        ? "Address is linked to orders and has been hidden"
        : "Address removed successfully"
    });

    setTimeout(() => setFeedback(null), 3000);

    // Refetch to ensure disabled addresses are filtered out
    await refetchAddresses();
    refreshPortalState();
    setDeletingIndex(null);
  };

  const handleEmailSave = async () => {
    const trimmed = pendingEmailValue.trim();
    if (!trimmed || !customerName) {
      return;
    }

    setEmailEditorOpen(false);
    setPhoneForVerify(portalState.phone || "");
    setShowVerifyModal(true);
  };

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

    router.push("/home");
  };

  const fullName =
    [customerProfile?.first_name, customerProfile?.last_name]
      .filter((name): name is string => Boolean(name?.trim()))
      .join(" ") ||
    customerProfile?.customer_name ||
    "Customer";

  const emailAddress = customerProfile?.email_id || "No email added yet";
  const profilePhone = customerProfile?.mobile_no || portalState.phone || "Not verified yet";

  const selectedOrderAddress =
    typeof (selectedOrderDetails as { customer_address?: string } | undefined)
      ?.customer_address === "string"
      ? (selectedOrderDetails as { customer_address?: string }).customer_address
      : portalState.address || "Address not available";

  const menuItems: Array<{ key: "profile" | "addresses" | "orders"; label: string }> = [
    { key: "profile", label: "Profile" },
    { key: "addresses", label: "Addresses" },
    { key: "orders", label: "Order History" },
  ];

  return (
    <>
      <main className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
        <div className="block md:hidden">
          <MobileHeader />
        </div>

        <div className="hidden md:block lg:hidden">
          <TabletHeader />
        </div>

        <div className="hidden lg:block">
          <DesktopHeader />
        </div>

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
                  fullName={fullName}
                  emailAddress={emailAddress}
                  profilePhone={profilePhone}
                  onEditEmail={() => {
                    setPendingEmailValue(
                      emailAddress === "No email added yet" ? "" : emailAddress
                    );
                    setEmailEditorOpen(true);
                  }}
                  onEditPhone={handleOpenPhoneUpdate}
                />
              )}

              {activeTab === "addresses" && (
                <AddressesTab
                  addresses={portalState.deliveryAddresses}
                  isLoading={isLoadingAddresses}
                  profilePhone={profilePhone}
                  onAddAddress={handleAddNewAddress}
                  onEditAddress={setActiveDeliveryIndex}
                />
              )}

              {activeTab === "orders" && (
                <OrdersTab
                  orders={customerOrders}
                  formatCurrency={formatCurrency}
                  onSelectOrder={setSelectedOrderName}
                />
              )}
              </div>
            </div>

        </section>

        <Footer />
        <BottomNav />
        <CartSidebarWidget />
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

      {showPhoneModal && (
        <PhoneModal
          open={showPhoneModal}
          allowExistingPhone={true}
          onClose={handlePhoneModalClose}
        />
      )}

      {showVerifyModal && (
        <PhoneVerifyModal
          open={showVerifyModal}
          phone={phoneForVerify}
          onClose={handleVerifyModalClose}
          onChangePhone={handleChangePhoneFromVerify}
        />
      )}

      {activeDeliveryIndex !== null && (
        <AddressSelectModal
          open={true}
          onClose={() => setActiveDeliveryIndex(null)}
          onSelect={handleAddressSelect}
          redirectTo={null}
          existingAddressId={
            portalState.deliveryAddresses[activeDeliveryIndex]?.addressId || null
          }
          customTitle={
            portalState.deliveryAddresses[activeDeliveryIndex]?.title || undefined
          }
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          open={true}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleRemoveAddress}
          title="Remove address?"
          message={`Are you sure you want to remove "${confirmDelete.label}"? This action cannot be undone.`}
          confirmText="Remove"
          cancelText="Keep"
          variant="danger"
        />
      )}

      {emailEditorOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
                  Update email
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Edit your email address</h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailEditorOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:text-red-600"
                aria-label="Close edit email"
              >
                <X size={16} />
              </button>
            </div>

            <label className="mt-5 block text-sm font-medium text-slate-700">
              Email address
              <input
                type="email"
                value={pendingEmailValue}
                onChange={(event) => setPendingEmailValue(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-300 focus:bg-white"
                placeholder="name@example.com"
              />
            </label>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEmailEditorOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmailSave}
                disabled={!pendingEmailValue.trim()}
                className="rounded-full bg-red-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                Verify & save
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrderName && selectedOrderDetails && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
                  Order details
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{selectedOrderDetails.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderName(null)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:text-red-600"
                aria-label="Close order details"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Date</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {new Date(selectedOrderDetails.transaction_date).toLocaleDateString("en-AE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{selectedOrderDetails.status}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatCurrency(selectedOrderDetails.grand_total)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Delivery address
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{selectedOrderAddress}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <Package size={18} />
                  </div>
                  <h4 className="text-base font-semibold text-slate-900">Order items</h4>
                </div>

                <div className="space-y-3">
                  {selectedOrderDetails.items?.map((item) => (
                    <div
                      key={`${selectedOrderDetails.name}-${item.name}-${item.item_code}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {item.item_name || item.item_code || item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Qty: {item.qty}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatCurrency(item.amount ?? item.qty * item.rate)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <ReceiptText size={18} />
                    </div>
                    <h4 className="text-base font-semibold text-slate-900">Pricing</h4>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Total items</span>
                      <span>{selectedOrderDetails.total_qty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Grand total</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(selectedOrderDetails.grand_total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <CreditCard size={18} />
                    </div>
                    <h4 className="text-base font-semibold text-slate-900">Payment</h4>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Method</span>
                      <span className="font-medium text-slate-800">
                        {selectedOrderDetails.status === "Paid" ? "Card / COD" : "Awaiting payment"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Order status</span>
                      <span className="font-medium text-slate-800">{selectedOrderDetails.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

