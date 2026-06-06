"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Pencil, Phone, ShieldCheck } from "lucide-react";
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
  useSetCustomerInfoMutation,
  useUpdateAddressMutation,
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
  const [isSyncingFromBackend, setIsSyncingFromBackend] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [updatingTitleIndex, setUpdatingTitleIndex] = useState<number | null>(
    null
  );
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
  const [updateAddress] = useUpdateAddressMutation();

  // Fetch addresses from ERPNext backend
  const customerName = getCustomerName();
  const {
    data: backendAddresses,
    isLoading: isLoadingAddresses,
    refetch: refetchAddresses,
  } = useGetCustomerAddressesQuery(customerName, {
    skip: !customerName || !portalState.isVerified,
  });

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  useEffect(() => {
    if (!backendAddresses || isSyncingFromBackend) {
      return;
    }

    // Prevent race condition: don't overwrite during active user mutations
    if (deletingIndex !== null || updatingTitleIndex !== null) {
      return;
    }

    const syncedAddresses: DeliveryAddressItem[] = backendAddresses.map(
      (address: any, index: number) => ({
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

    setIsSyncingFromBackend(true);
    writeDeliveryAddresses(syncedAddresses);

    if (syncedAddresses[0]) {
      saveDeliveryAddress(
        syncedAddresses[0].address,
        syncedAddresses[0].addressId
      );
    } else {
      saveDeliveryAddress("", "");
    }

    setTimeout(() => setIsSyncingFromBackend(false), 100);
  }, [
    backendAddresses,
    isSyncingFromBackend,
    deletingIndex,
    updatingTitleIndex,
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

  const showDeleteConfirmation = (index: number) => {
    if (portalState.deliveryAddresses.length === 1) {
      setFeedback({
        type: "error",
        message:
          "You must keep at least one address. Add another before removing this one.",
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    const addressToRemove = portalState.deliveryAddresses[index];
    if (!addressToRemove) return;

    const addressLabel =
      addressToRemove.title || addressToRemove.address || "this address";
    setConfirmDelete({ index, label: addressLabel });
  };

  const handleRemoveAddress = async () => {
    if (!confirmDelete) return;

    const indexToRemove = confirmDelete.index;
    const addressToRemove = portalState.deliveryAddresses[indexToRemove];
    if (!addressToRemove) return;

    setConfirmDelete(null);
    setDeletingIndex(indexToRemove);

    if (addressToRemove.addressId) {
      try {
        await deleteAddress(addressToRemove.addressId).unwrap();
      } catch (err: unknown) {
        const errorData =
          typeof err === "object" && err !== null && "data" in err
            ? (
                err as {
                  data?: { _server_messages?: unknown; exception?: unknown };
                }
              ).data
            : undefined;

        const serverMessages = String(
          errorData?._server_messages || errorData?.exception || ""
        );

        if (serverMessages.includes("LinkExistsError")) {
          try {
            await disableAddress(addressToRemove.addressId).unwrap();
          } catch (disableErr) {
            console.warn(
              "Failed to disable linked backend address:",
              disableErr
            );
            setFeedback({
              type: "error",
              message: "Failed to remove address. Please try again.",
            });
            setTimeout(() => setFeedback(null), 4000);
            setDeletingIndex(null);
            return;
          }
        } else {
          console.warn("Failed to delete backend address:", err);
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

    setFeedback({ type: "success", message: "Address removed successfully" });
    setTimeout(() => setFeedback(null), 3000);

    refetchAddresses();
    refreshPortalState();
    setDeletingIndex(null);
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updatedAddresses = portalState.deliveryAddresses.map((item, i) =>
      i === index ? { ...item, title: newTitle } : item
    );
    writeDeliveryAddresses(updatedAddresses);
  };

  const handleTitleCommit = async (index: number) => {
    const address = portalState.deliveryAddresses[index];
    if (!address?.addressId) return;

    // Build the accurate un-prefixed validation string
    const cleanFriendlyTitle = extractFriendlyTitle(
      address.title,
      portalState.phone
    );
    if (!cleanFriendlyTitle) return;

    // Prepend target structure identifier configuration safely before hitting API
    const stablePhone = getCustomerName() || portalState.phone || "";
    const slug = cleanFriendlyTitle
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const backendTitle = stablePhone ? `${stablePhone}-${slug}` : slug;

    setUpdatingTitleIndex(index);

    try {
      await updateAddress({
        addressName: address.addressId,
        address_title: backendTitle,
      }).unwrap();

      // Update with matching casing locally instantly
      const updatedAddresses = portalState.deliveryAddresses.map((item, i) =>
        i === index ? { ...item, title: cleanFriendlyTitle } : item
      );
      writeDeliveryAddresses(updatedAddresses);

      setFeedback({
        type: "success",
        message: "Address title updated successfully",
      });
      setTimeout(() => setFeedback(null), 2000);

      refetchAddresses();
    } catch (err: unknown) {
      console.warn("Failed to update address title:", err);
      setFeedback({
        type: "error",
        message: "Failed to update title. Please try again.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setUpdatingTitleIndex(null);
    }
  };

  const phoneLabel =
    portalState.isVerified && portalState.phone
      ? portalState.phone
      : "Not verified yet";

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      <div className="hidden md:block lg:hidden">
        <TabletHeader />
      </div>

      <div className="hidden lg:block">
        <DesktopHeader />
      </div>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {feedback && (
          <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 min-w-80 max-w-md rounded-2xl border-2 px-6 py-4 shadow-2xl animate-in slide-in-from-top-4 duration-300 ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <p className="text-sm font-semibold text-center">
              {feedback.message}
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-white via-slate-50 to-orange-50/50 p-5 shadow-sm shadow-slate-200/40 sm:p-7 lg:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-600">
                Account
              </p>
              <h1 className="mt-2 text-xl font-normal leading-wide text-slate-900 sm:text-xl lg:text-2xl">
                Profile & Preferences
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                Manage your verified phone and delivery details for smoother
                checkout.
              </p>
            </div>

            <Link
              href="/home"
              className="inline-flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft size={14} />
              Back To Home
            </Link>
          </div>

          <div className="mt-8 flow-root">
            <div className="-my-6 divide-y divide-slate-200">
              {/* -- Verified Phone Section -- */}
              <div className="py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                      <Phone size={20} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-slate-900">
                        Verified Phone
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {phoneLabel}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenPhoneUpdate}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800 sm:w-auto"
                  >
                    <Pencil size={14} />
                    {portalState.isVerified ? "Update" : "Verify"}
                  </button>
                </div>
                {portalState.isVerified && (
                  <div className="mt-4 pl-16 sm:pl-0">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      <ShieldCheck size={14} />
                      <span>Phone is verified</span>
                    </div>
                  </div>
                )}
              </div>

              {/* -- Delivery Addresses Section -- */}
              <div className="py-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Delivery Addresses
                      </p>
                      <p className="text-xs text-slate-500">
                        Manage your saved locations
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address List Container */}
                <div className="space-y-4">
                  {isLoadingAddresses ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" />
                      <p className="mt-2 text-sm text-slate-500">
                        Loading saved addresses...
                      </p>
                    </div>
                  ) : portalState.deliveryAddresses.length > 0 ? (
                    portalState.deliveryAddresses.map((delivery, index) => (
                      <div
                        key={delivery.id ?? String(index)}
                        className="group rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-red-600/30 hover:shadow-md"
                      >
                        {/* Address Title Configuration Row */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                            Delivery to (
                          </span>
                          <input
                            type="text"
                            value={delivery.title}
                            onChange={(e) =>
                              handleTitleChange(index, e.target.value)
                            }
                            onBlur={() => {
                              void handleTitleCommit(index);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                              }
                            }}
                            disabled={updatingTitleIndex === index}
                            placeholder={index === 0 ? "Home" : "Office, Work…"}
                            className="text-[11px] font-semibold uppercase tracking-wider text-red-600 bg-transparent border-b border-dashed border-slate-300 focus:border-red-600 focus:outline-none w-24 text-center placeholder:text-slate-300 disabled:opacity-50"
                          />
                          {updatingTitleIndex === index && (
                            <span className="ml-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          )}
                          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                            )
                          </span>

                          {/* Upgraded Native Role Badges Layout based on Database parameters */}
                          <div className="ml-2 flex flex-wrap gap-1 items-center">
                            {index === 0 && (
                              <span className="rounded bg-stone-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                                Primary Default
                              </span>
                            )}
                            {(delivery as any).isDelivery && (
                              <span className="rounded bg-red-50 border border-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-700">
                                Shipping
                              </span>
                            )}
                            {(delivery as any).isBilling && (
                              <span className="rounded bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
                                Billing
                              </span>
                            )}
                          </div>

                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => showDeleteConfirmation(index)}
                              disabled={deletingIndex === index}
                              className="ml-auto text-[10px] font-medium uppercase tracking-wide text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                              {deletingIndex === index
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          )}
                        </div>

                        {/* Address Content Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-relaxed ${
                                delivery.address
                                  ? "text-slate-700"
                                  : "text-slate-400 italic"
                              }`}
                            >
                              {delivery.address || "No address selected yet"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveDeliveryIndex(index)}
                            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                              delivery.address
                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                : "bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700"
                            }`}
                          >
                            <Pencil size={12} className="inline mr-1.5" />
                            {delivery.address ? "Update" : "Select"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <MapPin
                        size={32}
                        className="mx-auto mb-3 text-slate-300"
                      />
                      <p className="text-sm text-slate-500">
                        No delivery addresses saved yet
                      </p>
                    </div>
                  )}

                  {/* Add Another Address Action Trigger */}
                  <button
                    type="button"
                    onClick={handleAddNewAddress}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-600 transition-all hover:border-red-600 hover:bg-brand-50 hover:text-red-600"
                  >
                    <span className="text-lg leading-none">+</span>
                    Add Another Address
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
      <CartSidebarWidget />

      {showPhoneModal && (
        <PhoneModal
          open={showPhoneModal}
          allowExistingPhone
          onClose={handlePhoneModalClose}
        />
      )}

      {showVerifyModal && (
        <PhoneVerifyModal
          open={showVerifyModal}
          phone={phoneForVerify}
          onClose={handleVerifyModalClose}
        />
      )}

      {activeDeliveryIndex !== null && (
        <AddressSelectModal
          open={true}
          onClose={() => setActiveDeliveryIndex(null)}
          onSelect={handleAddressSelect}
          redirectTo={null}
          existingAddressId={
            portalState.deliveryAddresses[activeDeliveryIndex]?.addressId ||
            null
          }
          customTitle={
            portalState.deliveryAddresses[activeDeliveryIndex]?.title ||
            undefined
          }
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          open={true}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleRemoveAddress}
          title="Remove Address?"
          message={`Are you sure you want to remove "${confirmDelete.label}"? This action cannot be undone.`}
          confirmText="Yes, Remove"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      <Footer />
    </main>
  );
}

