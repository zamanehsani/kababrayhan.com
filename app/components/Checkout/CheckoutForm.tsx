import React, { useEffect, useState } from "react";
import AddressSelectModal from "../home/modal/AddressSelectModal";
import ConfirmDialog from "../shared/ConfirmDialog";
import {
  useDeleteAddressMutation,
  useDisableAddressMutation,
  useUpdateAddressMutation,
  useGetCustomerAddressesQuery,
} from "../../redux/api";
import type { Address } from "../../redux/apiType";
import { getCustomerName } from "@/app/lib/customerPortal";
import ErrorIcon from "../icon/ErrorIcon";
import LocationPinIcon from "../icon/LocationPinIcon";
import PhoneIcon from "../icon/PhoneIcon";

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
  selectedAddressId?: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  form,
  setForm,
  error,
  selectedAddressId,
}) => {
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState<number | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<{
    index: number;
    label: string;
  } | null>(null);
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

  useEffect(() => {
    if (!customerAddresses?.length) return;

    const mappedAddresses: DeliveryAddressItem[] = customerAddresses.map(
      (addr: Address, index: number) => ({
        id: addr.name || String(index),
        title:
          extractFriendlyTitle(addr.address_title, form.phone) ||
          addr.address_type ||
          `Address ${index + 1}`,
        address:
          addr.address_line1 ||
          addr.address_line2 ||
          "",
        addressId: addr.name,
        isDelivery: addr.is_shipping_address === 1,
        isBilling: addr.is_primary_address === 1,
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

  const handleRemoveAddress = async () => {
    if (!confirmDelete) return;

    const indexToRemove = confirmDelete.index;
    const addressToRemove = form.deliveryAddresses[indexToRemove];
    if (!addressToRemove) return;

    setConfirmDelete(null);

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
            return;
          }
        } else {
          console.warn("Failed to delete checkout address:", err);
          setFeedback({
            type: "error",
            message: "Failed to remove address. Please try again.",
          });
          setTimeout(() => setFeedback(null), 4000);
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
  };

  return (
    <>
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 min-w-80 max-w-md rounded-2xl border-2 px-6 py-4 shadow-2xl animate-in slide-in-from-top-4 duration-300 ${feedback.type === "success"
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
        <h2 className="mb-2 flex items-center gap-3 text-xl font-medium tracking-wide text-stone-900">
          <span className="h-6 w-1 rounded-full bg-red-600" />
          Delivery Details
        </h2>

        <div className="space-y-8">
          {/* FIX: Map over form.deliveryAddresses instead of customerAddresses */}
          {form.deliveryAddresses?.map((localAddressItem, index) => {
            const targetId = selectedAddressId || (globalThis.localStorage ? localStorage.getItem("uae_delivery_address_id") : "");

            // ONLY show the single selected card on the checkout page
            if (targetId && localAddressItem.addressId !== targetId) {
              return null;
            }

            const resolvedAddress = localAddressItem.address || "";
            // const displayTitle = localAddressItem.title || "Address";

            return (
              <div key={localAddressItem.addressId || index} className="group">
             

                <div className=" p-4 ">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-500 shadow-sm">
                          <PhoneIcon />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Contact
                          </p>
                          <p className="truncate text-sm font-medium text-stone-900">
                            {form.phone || "No phone provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                          <LocationPinIcon />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Address
                          </p>
                          <p className="text-sm font-medium leading-snug text-stone-900">
                            {resolvedAddress || "No address selected"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveDeliveryIndex(index)}
                      className="w-full shrink-0 rounded-xl px-4 py-2 text-[13px] font-medium tracking-widest bg-stone-100 text-stone-600 hover:bg-red-600 hover:text-white sm:w-auto"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}


          {!selectedAddressId && (
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
          )}
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
