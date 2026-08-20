"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  Menu,
  Package,
  PencilLine,
  Phone,
  Plus,
  ReceiptText,
  UserRound,
  X,
} from "lucide-react";
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
import Footer from "../components/Footer/Footer";


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

  const { data: customerOrders = [] } = useGetCustomerSalesOrdersQuery(
    customerName || "",
    {
      skip: !customerName || !portalState.isVerified,
    }
  );

  const { data: selectedOrderDetails } = useGetSalesOrderQuery(
    selectedOrderName || "",
    {
      skip: !selectedOrderName,
    }
  );

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

  const fullName =
    customerProfile?.customer_name ||
    [customerProfile?.first_name, customerProfile?.last_name]
      .filter(Boolean)
      .join(" ") ||
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

          <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
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

          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40 lg:block">
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
              </nav>
            </aside>

            <div className="space-y-6">
                {activeTab === "profile" && (
                  <div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-inner shadow-red-100">
                          <UserRound size={24} />
                        </div>
                        <div>
                          <h2 className="mt-2 text-xl font-semibold text-slate-900">
                            {fullName}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            {customerProfile?.customer_name || "Customer profile"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                              <Mail size={18} />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Email
                              </p>
                              <p className="mt-1 text-sm text-slate-700">{emailAddress}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingEmailValue(
                                emailAddress === "No email added yet" ? "" : emailAddress
                              );
                              setEmailEditorOpen(true);
                            }}
                            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-red-200 hover:text-red-600"
                            aria-label="Edit email"
                          >
                            <PencilLine size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                              <Phone size={18} />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Phone
                              </p>
                              <p className="mt-1 text-sm text-slate-700">{profilePhone}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenPhoneUpdate}
                            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-red-200 hover:text-red-600"
                            aria-label="Edit phone"
                          >
                            <PencilLine size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "addresses" && (
                  <div className="py-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Delivery Addresses</p>
                          <p className="text-xs text-slate-500">Manage your saved locations</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddNewAddress}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-red-200 hover:text-red-600"
                        aria-label="Add another address"
                      >
                        <Plus size={16} strokeWidth={2} />
                      </button>
                    </div>

                    <div className="space-y-5">
                      {isLoadingAddresses ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" />
                          <p className="mt-2 text-sm text-slate-500">Loading saved addresses...</p>
                        </div>
                      ) : portalState.deliveryAddresses.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                          {portalState.deliveryAddresses.map((delivery, index) => (
                            <div
                              key={delivery.id ?? String(index)}
                              className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(15,23,42,0.1)]"
                            >
                              <div className="relative h-44 overflow-hidden bg-[#e9eef1]">
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.02))]" />
                                <div className="absolute inset-0 opacity-80">
                                  <div className="absolute inset-y-0 left-7 w-[10%] rotate-[-8deg] rounded-full bg-[#dfe7eb]" />
                                  <div className="absolute inset-y-0 right-10 w-[14%] rotate-[12deg] rounded-full bg-[#dfe7eb]" />
                                  <div className="absolute left-1/2 top-0 h-full w-[18%] -translate-x-1/2 rotate-[10deg] bg-[#dfe7eb]" />
                                  <div className="absolute left-10 top-12 h-10 w-28 rounded-[18px] bg-[#f3f4f6]" />
                                  <div className="absolute right-10 top-20 h-10 w-24 rounded-[18px] bg-[#f3f4f6]" />
                                  <div className="absolute bottom-8 left-8 h-12 w-28 rounded-[18px] bg-[#f3f4f6]" />
                                </div>

                                <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#5d1a80] text-white shadow-lg shadow-violet-200/80">
                                  <MapPin size={20} className="text-white" />
                                </div>

                                <div className="absolute right-4 top-4 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setActiveDeliveryIndex(index)}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#1f9d94] bg-[#f0fdfa] px-3 py-2 text-xs font-semibold text-[#0f766e] shadow-sm transition-transform hover:scale-[1.02]"
                                    aria-label="Edit address"
                                  >
                                    <PencilLine size={14} />
                                    Edit
                                  </button>
                                </div>

                                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-700 shadow-sm">
                                    <span className="h-2 w-2 rounded-full bg-[#5d1a80]" />
                                    {delivery.title || (index === 0 ? "Home" : "Address")}
                                  </div>
                                  {index === 0 && (
                                    <span className="rounded-full bg-[#0f172a] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3 p-3">
                                <div className="">
                                  <p
                                    className="text-[15px] leading-7 text-slate-700"
                                    style={{
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "block",
                                    }}
                                  >
                                    {delivery.address || "No address selected yet"}
                                  </p>
                                </div>

                                <div className="space-y-2 border-t border-slate-100 pt-3">
                                  <div className="flex items-center gap-2 px-2 text-sm text-slate-600">
                                    <Phone size={16} className="text-[#0f766e]" />
                                    <span>{profilePhone}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                          <MapPin size={32} className="mx-auto mb-3 text-slate-300" />
                          <p className="text-sm text-slate-500">No delivery addresses saved yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "orders" && (
                  <div className="py-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Orders</p>
                          <p className="text-xs text-slate-500">Recent purchases and order history</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {customerOrders.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                          No orders have been placed yet.
                        </div>
                      ) : (
                        customerOrders.map((order) => (
                          <button
                            key={order.name}
                            type="button"
                            onClick={() => setSelectedOrderName(order.name)}
                            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-red-200 hover:shadow-md"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Order name
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{order.name}</p>
                              </div>
                              <div className="sm:text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Total
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {formatCurrency(order.grand_total)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays size={12} />
                                {new Date(order.transaction_date).toLocaleDateString("en-AE", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-semibold text-red-600">
                                View details
                                <ReceiptText size={12} />
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

        </section>

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
            </nav>
          </aside>
        </div>
      )}

      <Footer />

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

