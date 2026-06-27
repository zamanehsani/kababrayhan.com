import React, { useEffect, useState } from "react";
import AddressSelectModal from "../home/modal/AddressSelectModal";
import ConfirmDialog from "../shared/ConfirmDialog";
import {
  useDeleteAddressMutation,
  useDisableAddressMutation,
  useUpdateAddressMutation,
  useGetCustomerAddressesQuery,
} from "../../redux/api";
import { getCustomerName } from "@/app/lib/customerPortal";
import ErrorIcon from "../icon/ErrorIcon";
import AddressRoles from "../address/AddressRoles";
import LocationPinIcon from "../icon/LocationPinIcon";
import ContactPhoneCard from "./ContactPhoneCard";

export type DeliveryAddressItem = {
  id?: string;
  title: string;
  address: string;
  addressId: string;
  isDelivery?: boolean;
  isBilling?: boolean;
};

interface CheckoutFormProps {
  form: {
    phone: string;
    address: string;
    deliveryAddresses: DeliveryAddressItem[];
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      phone: string;
      address: string;
      deliveryAddresses: DeliveryAddressItem[];
    }>
  >;
  error: string | null;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  form,
  setForm,
  error,
}) => {
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState<number | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<{
    index: number;
    label: string;
  } | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [updatingTitleIndex, setUpdatingTitleIndex] = useState<number | null>(
    null
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteAddress] = useDeleteAddressMutation();
  const [disableAddress] = useDisableAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();

  const customerName = getCustomerName() || form.phone;
  const { data: customerAddresses, refetch: refetchAddresses } =
    useGetCustomerAddressesQuery(customerName, {
      skip: !customerName,
    });
  const toAddressTitleSlug = (title: string) =>
    title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  useEffect(() => {
    const savedPhone = localStorage.getItem("uae_phone");
    const savedAddress = localStorage.getItem("uae_address");

    const rawDelivery = localStorage.getItem("uae_delivery_addresses");
    let deliveryAddresses: DeliveryAddressItem[];

    if (rawDelivery) {
      try {
        deliveryAddresses = JSON.parse(rawDelivery);
      } catch {
        deliveryAddresses = [
          {
            title: "Home",
            address:
              localStorage.getItem("uae_delivery_address") ||
              localStorage.getItem("uae_address") ||
              "",
            addressId:
              localStorage.getItem("uae_delivery_address_id") ||
              localStorage.getItem("uae_address_id") ||
              "",
            isDelivery: true,
            isBilling: true,
          },
        ];
      }
    } else {
      deliveryAddresses = [
        {
          title: "Home",
          address:
            localStorage.getItem("uae_delivery_address") ||
            localStorage.getItem("uae_address") ||
            "",
          addressId:
            localStorage.getItem("uae_delivery_address_id") ||
            localStorage.getItem("uae_address_id") ||
            "",
          isDelivery: true,
          isBilling: true,
        },
      ];
    }

    if (
      savedPhone ||
      savedAddress ||
      deliveryAddresses.some((d) => d.address)
    ) {
      setForm((prev) => ({
        ...prev,
        phone: savedPhone || prev.phone,
        address: savedAddress || prev.address,
        deliveryAddresses: deliveryAddresses.some((d) => d.address)
          ? deliveryAddresses
          : prev.deliveryAddresses,
      }));
    }
  }, [setForm]);

  useEffect(() => {
    if (!customerAddresses?.length) return;

    const mappedAddresses: DeliveryAddressItem[] = customerAddresses.map(
      (addr: any, index: number) => ({
        id: addr.name || String(index),

        // Strip prefixes right here during initial parse
        title:
          extractFriendlyTitle(addr.address_title, form.phone) ||
          addr.address_type ||
          `Address ${index + 1}`,

        address: addr.display || addr.address || addr.address_line1 || "",

        addressId: addr.name,

        isDelivery:
          addr.is_shipping_address === 1 || addr.is_shipping_address === "1",

        isBilling:
          addr.is_primary_address === 1 || addr.is_primary_address === "1",
      })
    );

    setForm((prev) => ({
      ...prev,
      deliveryAddresses: mappedAddresses,
    }));

    localStorage.setItem(
      "uae_delivery_addresses",
      JSON.stringify(mappedAddresses)
    );
  }, [customerAddresses, setForm, form.phone]);

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = form.deliveryAddresses.map((da, i) =>
      i === index ? { ...da, title: newTitle } : da
    );
    setForm((prev) => ({ ...prev, deliveryAddresses: updated }));
    localStorage.setItem("uae_delivery_addresses", JSON.stringify(updated));
  };

  const handleTitleCommit = async (index: number) => {
    const current = form.deliveryAddresses[index];
    if (!current?.addressId) return;

    // Build friendly clean display value
    const cleanFriendlyTitle = extractFriendlyTitle(current.title, form.phone);
    if (!cleanFriendlyTitle) return;

    // Convert friendly title to backend title format (e.g., "+971567777788-offi")
    const backendTitle = buildBackendTitle(
      cleanFriendlyTitle,
      form.phone || ""
    );

    setUpdatingTitleIndex(index);

    try {
      await updateAddress({
        addressName: current.addressId,
        // Save prefixed title configuration
        address_title: backendTitle,
      }).unwrap();

      // Instantly update the local state to match what was committed
      const updated = form.deliveryAddresses.map((da, i) =>
        i === index ? { ...da, title: cleanFriendlyTitle } : da
      );
      setForm((prev) => ({ ...prev, deliveryAddresses: updated }));
      localStorage.setItem("uae_delivery_addresses", JSON.stringify(updated));

      // Refetch source-of-truth from backend
      await refetchAddresses();

      setFeedback({
        type: "success",
        message: "Address title updated successfully",
      });

      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      console.warn("Failed to update checkout address title:", err);

      setFeedback({
        type: "error",
        message: "Failed to update title",
      });

      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setUpdatingTitleIndex(null);
    }
  };

  const showDeleteConfirmation = (index: number) => {
    // Prevent deleting the last address
    if (form.deliveryAddresses.length === 1) {
      setFeedback({
        type: "error",
        message:
          "You must keep at least one address. Add another before removing this one.",
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    const addressToRemove = form.deliveryAddresses[index];
    if (!addressToRemove) return;

    const addressLabel =
      addressToRemove.title || addressToRemove.address || "this address";
    setConfirmDelete({ index, label: addressLabel });
  };

  const handleRemoveAddress = async () => {
    if (!confirmDelete) return;

    const indexToRemove = confirmDelete.index;
    const addressToRemove = form.deliveryAddresses[indexToRemove];
    if (!addressToRemove) return;

    setConfirmDelete(null);
    setDeletingIndex(indexToRemove);

    // Try deleting from ERPNext first
    if (addressToRemove.addressId) {
      try {
        await deleteAddress(addressToRemove.addressId).unwrap();
      } catch (err: unknown) {
        const errorData =
          typeof err === "object" && err !== null && "data" in err
            ? (
                err as {
                  data?: {
                    _server_messages?: unknown;
                    exception?: unknown;
                  };
                }
              ).data
            : undefined;

        const serverMessages = String(
          errorData?._server_messages || errorData?.exception || ""
        );

        // If address is linked to Sales Order etc
        // ERPNext prevents deletion → disable instead
        if (serverMessages.includes("LinkExistsError")) {
          try {
            await disableAddress(addressToRemove.addressId).unwrap();
          } catch (disableErr) {
            console.warn("Failed to disable checkout address:", disableErr);
            setFeedback({
              type: "error",
              message: "Failed to remove address. Please try again.",
            });
            setTimeout(() => setFeedback(null), 4000);
            setDeletingIndex(null);
            return;
          }
        } else {
          console.warn("Failed to delete checkout address:", err);
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

    // Remove locally
    const updated = form.deliveryAddresses.filter(
      (_, i) => i !== indexToRemove
    );

    setForm((prev) => ({
      ...prev,
      deliveryAddresses: updated,
      address: updated[0]?.address || "",
    }));

    // Sync localStorage
    localStorage.setItem("uae_delivery_addresses", JSON.stringify(updated));

    // Keep primary/default address synced
    if (updated[0]) {
      localStorage.setItem("uae_delivery_address", updated[0].address);

      localStorage.setItem("uae_delivery_address_id", updated[0].addressId);

      localStorage.setItem("uae_address", updated[0].address);

      localStorage.setItem("uae_address_id", updated[0].addressId);
    } else {
      localStorage.removeItem("uae_delivery_address");
      localStorage.removeItem("uae_delivery_address_id");
      localStorage.removeItem("uae_address");
      localStorage.removeItem("uae_address_id");
    }

    setFeedback({ type: "success", message: "Address removed successfully" });
    setTimeout(() => setFeedback(null), 3000);

    // Refetch to ensure consistency across devices/tabs
    refetchAddresses();

    setDeletingIndex(null);
  };

  const handleToggleDelivery = async (index: number) => {
    const updated = form.deliveryAddresses.map((item, i) => ({
      ...item,
      isDelivery: i === index ? !item.isDelivery : item.isDelivery,
    }));

    setForm((prev) => ({
      ...prev,
      deliveryAddresses: updated,
    }));

    localStorage.setItem("uae_delivery_addresses", JSON.stringify(updated));

    const selected = updated[index];

    if (selected?.addressId) {
      try {
        await updateAddress({
          addressName: selected.addressId,
          is_shipping_address: selected.isDelivery ? 1 : 0,
        }).unwrap();
      } catch (err) {
        console.error("Failed to update delivery address:", err);
      }
    }
  };

  const handleToggleBilling = async (index: number) => {
    const updated = form.deliveryAddresses.map((item, i) => ({
      ...item,
      isBilling: i === index,
    }));

    setForm((prev) => ({
      ...prev,
      deliveryAddresses: updated,
    }));

    localStorage.setItem("uae_delivery_addresses", JSON.stringify(updated));

    const selected = updated[index];

    if (selected?.addressId) {
      try {
        await updateAddress({
          addressName: selected.addressId,
          is_primary_address: selected.isBilling ? 1 : 0,
        }).unwrap();
      } catch (err) {
        console.error("Failed to update billing address:", err);
      }
    }
  };

  const extractFriendlyTitle = (addressTitle?: string, phone?: string) => {
    if (!addressTitle) return "";

    let clean = addressTitle.trim();

    // Recursively strip out the phone number prefix if it exists
    if (phone) {
      const formattedPhone = phone.trim();
      // This will catch "+97156..." or "97156..." prefixes followed by a dash
      while (clean.startsWith(formattedPhone)) {
        clean = clean.slice(formattedPhone.length).replace(/^-/, "");
      }
      // Also try stripping it without the '+' character just in case
      const phoneNoPlus = formattedPhone.replace("+", "");
      while (clean.startsWith(phoneNoPlus)) {
        clean = clean.slice(phoneNoPlus.length).replace(/^-/, "");
      }
    }

    // Replace lingering dashes with spaces
    clean = clean.replace(/-/g, " ").trim();

    return clean;
  };

  const buildBackendTitle = (label: string, phone?: string) => {
    const slug = label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Prepend the phone number prefix so ERPNext keeps its structured identifier
    return phone ? `${phone}-${slug}` : slug;
  };

  return (
    <>
      {/* Feedback Toast */}
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

      <section
        className=" bg-white p-2"
        data-address-section
      >
        <h2 className="mb-8 flex items-center gap-3 text-xl font-medium tracking-wide text-stone-900">
          <span className="h-6 w-1 rounded-full bg-red-600" />
          Delivery Details
        </h2>

        <div className="space-y-8">
          <ContactPhoneCard phone={form.phone} />

          {customerAddresses?.map((address, index) => {
            const isDeliveryChecked = address.is_shipping_address === 1;
            const isBillingChecked = address.is_primary_address === 1;
            const resolvedAddress = address.address_line1 || "";

            // 1. CRITICAL: Read directly from your local state array instead of the raw API cache!
            const localAddressItem = form.deliveryAddresses[index];

            // 2. Fall back cleanly if the local array item isn't ready yet
            const displayTitle = localAddressItem?.title || "";

            return (
              <div key={address.name || index} className="group">
                <div className="mb-3 ml-1 flex items-center gap-1">
                  <span className="text-[13px] font-medium  tracking-wide text-stone-400 group-hover:text-red-600 transition-colors">
                    Delivery To&nbsp;(
                  </span>

                  {/* 3. Bind the input value to our tracked state value */}
                  <input
                    type="text"
                    value={displayTitle}
                    onChange={(e) => handleTitleChange(index, e.target.value)}
                    onBlur={() => {
                      void handleTitleCommit(index);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    disabled={updatingTitleIndex === index}
                    placeholder={index === 0 ? "Home" : `Address ${index + 1}`}
                    className="w-40 border-b border-dashed border-stone-300 bg-transparent text-center text-[13px] font-medium uppercase tracking-wide text-stone-600 placeholder:text-stone-300 focus:border-red-600 focus:outline-none disabled:opacity-50"
                  />

                  {updatingTitleIndex === index && (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  )}

                  <span className="text-[13px] font-medium uppercase tracking-wide text-stone-400 group-hover:text-red-600 transition-colors">
                    )
                  </span>

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => showDeleteConfirmation(index)}
                      disabled={deletingIndex === index}
                      className="ml-auto text-[11px] font-medium uppercase tracking-wide text-stone-300 transition-colors hover:text-red-400 disabled:opacity-50 disabled:cursor-wait"
                    >
                      {deletingIndex === index ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>

                <div
                  className={`flex flex-col gap-4 rounded-2xl border-2 p-5 transition-all sm:flex-row sm:items-center ${
                    resolvedAddress
                      ? "border-stone-100 bg-white shadow-xl shadow-stone-200/40"
                      : "border-dashed border-stone-200 bg-stone-50"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                        resolvedAddress
                          ? "bg-red-50 text-red-600"
                          : "bg-stone-200 text-stone-400"
                      }`}
                    >
                      <LocationPinIcon />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <p
                        className={`text-sm font-medium leading-snug ${
                          resolvedAddress
                            ? "text-stone-900"
                            : "text-stone-400 italic"
                        }`}
                      >
                        {resolvedAddress || "Select your delivery location..."}
                      </p>

                      <AddressRoles
                        isDelivery={isDeliveryChecked}
                        isBilling={isBillingChecked}
                        onToggleDelivery={() => handleToggleDelivery(index)}
                        onToggleBilling={() => handleToggleBilling(index)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveDeliveryIndex(index)}
                    className={`w-full shrink-0 rounded-xl px-4 py-2 text-[13px] font-medium uppercase tracking-widest transition-all active:scale-95 sm:w-auto ${
                      resolvedAddress
                        ? "bg-stone-100 text-stone-600 hover:bg-red-600 hover:text-white"
                        : "bg-red-600 text-white shadow-lg shadow-red-200"
                    }`}
                  >
                    {resolvedAddress ? "Edit" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => {
              const updated = [
                ...form.deliveryAddresses,
                {
                  id: String(Date.now()),
                  title: "",
                  address: "",
                  addressId: "",
                  isDelivery: false,
                  isBilling: false,
                },
              ];
              setForm((prev) => ({ ...prev, deliveryAddresses: updated }));
              localStorage.setItem(
                "uae_delivery_addresses",
                JSON.stringify(updated)
              );
              setActiveDeliveryIndex(updated.length - 1);
            }}
            className="ml-1 flex items-center gap-2 text-[13px] font-medium tracking-wide text-stone-400 transition-colors hover:text-red-600"
          >
            <span className="text-base leading-none">+</span> Add Delivery
            Address
          </button>
        </div>

        {error && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-600 ring-1 ring-red-100 animate-in fade-in slide-in-from-top-2">
            <ErrorIcon />
            {error}
          </div>
        )}

        {activeDeliveryIndex !== null && (
          <AddressSelectModal
            open={true}
            onClose={() => setActiveDeliveryIndex(null)}
            addressType="Billing"
            skipCustomerCreation={activeDeliveryIndex > 0}
            redirectTo={null}
            existingAddressId={
              form.deliveryAddresses[activeDeliveryIndex]?.addressId || null
            }
            customTitle={
              form.deliveryAddresses[activeDeliveryIndex]?.title ||
              `delivery-${activeDeliveryIndex + 1}`
            }
            onSelect={async (addressData) => {
              const resolvedAddress = addressData.name || "";
              const addressId = addressData.id;

              try {
                // Sync ERPNext native address roles
                await updateAddress({
                  addressName: addressId,

                  // Delivery address
                  is_shipping_address: 1,

                  // First/main checkout address becomes billing too
                  is_primary_address: activeDeliveryIndex === 0 ? 1 : 0,
                }).unwrap();

                // Local UI update
                const updated = form.deliveryAddresses.map((da, i) => ({
                  ...da,

                  ...(i === activeDeliveryIndex
                    ? {
                        address: resolvedAddress,
                        addressId,
                      }
                    : {}),

                  // only selected becomes delivery
                  isDelivery: i === activeDeliveryIndex,

                  // only first becomes billing
                  isBilling: activeDeliveryIndex === 0 ? i === 0 : da.isBilling,
                }));

                setForm((prev) => ({
                  ...prev,
                  deliveryAddresses: updated,
                }));

                localStorage.setItem(
                  "uae_delivery_addresses",
                  JSON.stringify(updated)
                );

                // Sync primary local values
                if (activeDeliveryIndex === 0) {
                  localStorage.setItem("uae_delivery_address", resolvedAddress);

                  localStorage.setItem("uae_delivery_address_id", addressId);

                  localStorage.setItem("uae_address", resolvedAddress);

                  localStorage.setItem("uae_address_id", addressId);
                }

                setFeedback({
                  type: "success",
                  message: "Address updated successfully",
                });

                setTimeout(() => setFeedback(null), 2500);

                refetchAddresses();
              } catch (err) {
                console.error("Failed to update address roles:", err);

                setFeedback({
                  type: "error",
                  message: "Failed to update address",
                });

                setTimeout(() => setFeedback(null), 4000);
              } finally {
                setActiveDeliveryIndex(null);
              }
            }}
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
      </section>
    </>
  );
};

export default CheckoutForm;
