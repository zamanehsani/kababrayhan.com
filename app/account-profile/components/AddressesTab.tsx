"use client";

import { useState } from "react";
import { MapPin, PencilLine, Phone, Plus } from "lucide-react";
import type { DeliveryAddressItem } from "@/app/lib/customerPortal";
import {
  saveDeliveryAddress,
  writeDeliveryAddresses,
} from "@/app/lib/customerPortal";
import { useDeleteAddressMutation, useDisableAddressMutation } from "@/app/redux/api";
import AddressSelectModal, {
  type SelectedAddress,
} from "../../components/home/modal/AddressSelectModal";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

type AddressesTabProps = {
  addresses: DeliveryAddressItem[];
  isLoading: boolean;
  profilePhone: string;
  onRefresh: () => void;
  onRefetchAddresses: () => void;
  onFeedback: (feedback: { type: "success" | "error"; message: string }) => void;
};

export default function AddressesTab({
  addresses,
  isLoading,
  profilePhone,
  onRefresh,
  onRefetchAddresses,
  onFeedback,
}: AddressesTabProps) {
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ index: number; label: string } | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [deleteAddress] = useDeleteAddressMutation();
  const [disableAddress] = useDisableAddressMutation();

  const handleAddressSelect = (addressData: SelectedAddress) => {
    if (activeDeliveryIndex === null) return;
    const updatedAddresses = addresses.map((address, index) =>
      index === activeDeliveryIndex
        ? { ...address, address: addressData.name || "", addressId: addressData.id }
        : address
    );
    writeDeliveryAddresses(updatedAddresses);
    if (activeDeliveryIndex === 0) saveDeliveryAddress(addressData.name || "", addressData.id);
    onRefresh();
    setActiveDeliveryIndex(null);
  };

  const handleAddNewAddress = () => {
    const updatedAddresses = [...addresses, { id: String(Date.now()), title: "", address: "", addressId: "" }];
    writeDeliveryAddresses(updatedAddresses);
    onRefresh();
    setActiveDeliveryIndex(updatedAddresses.length - 1);
  };

  const handleRemoveAddress = async () => {
    if (!confirmDelete) return;
    const indexToRemove = confirmDelete.index;
    const addressToRemove = addresses[indexToRemove];
    if (!addressToRemove) return;

    setConfirmDelete(null);
    setDeletingIndex(indexToRemove);
    let isFallbackDisable = false;

    try {
      if (addressToRemove.addressId) {
        await deleteAddress(addressToRemove.addressId).unwrap();
      }
    } catch (error: unknown) {
      const errorData = typeof error === "object" && error !== null && "data" in error
        ? (error as { data?: { _server_messages?: string; exception?: string; message?: string } }).data
        : undefined;
      const serverMessage = String(errorData?._server_messages || errorData?.exception || errorData?.message || "").toLowerCase();
      const isLinkedError = serverMessage.includes("linkexistserror") || serverMessage.includes("link exists") || serverMessage.includes("linked") || serverMessage.includes("cannot delete");

      if (!isLinkedError || !addressToRemove.addressId) {
        console.warn("Failed to delete address:", error);
        onFeedback({ type: "error", message: "Failed to remove address. Please try again." });
        setDeletingIndex(null);
        return;
      }

      try {
        await disableAddress(addressToRemove.addressId).unwrap();
        isFallbackDisable = true;
      } catch (disableError) {
        console.warn("Failed to disable linked address:", disableError);
        onFeedback({ type: "error", message: "Address is in use and cannot be removed. Please try again." });
        setDeletingIndex(null);
        return;
      }
    }

    const updatedAddresses = addresses.filter((_, index) => index !== indexToRemove);
    writeDeliveryAddresses(updatedAddresses);
    if (indexToRemove === 0) {
      const nextAddress = updatedAddresses[0];
      saveDeliveryAddress(nextAddress?.address || "", nextAddress?.addressId || "");
    }
    onFeedback({
      type: "success",
      message: isFallbackDisable ? "Address is linked to orders and has been hidden" : "Address removed successfully",
    });
    await onRefetchAddresses();
    onRefresh();
    setDeletingIndex(null);
  };

  return (
    <>
      <div className="py-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><MapPin size={20} /></div><div><p className="text-sm font-semibold text-slate-900">Delivery Addresses</p><p className="text-xs text-slate-500">Manage your saved locations</p></div></div>
          <button type="button" onClick={handleAddNewAddress} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-red-200 hover:text-red-600" aria-label="Add another address"><Plus size={16} strokeWidth={2} /></button>
        </div>
        <div className="space-y-5">
          {isLoading ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" /><p className="mt-2 text-sm text-slate-500">Loading saved addresses...</p></div> : addresses.length > 0 ? <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {addresses.map((delivery, index) => <div key={delivery.id ?? String(index)} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(15,23,42,0.1)]">
              <div className="relative h-44 overflow-hidden bg-[#e9eef1]"><div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.02))]" /><div className="absolute inset-0 opacity-80"><div className="absolute inset-y-0 left-7 w-[10%] rotate-[-8deg] rounded-full bg-[#dfe7eb]" /><div className="absolute inset-y-0 right-10 w-[14%] rotate-[12deg] rounded-full bg-[#dfe7eb]" /><div className="absolute left-1/2 top-0 h-full w-[18%] -translate-x-1/2 rotate-[10deg] bg-[#dfe7eb]" /><div className="absolute left-10 top-12 h-10 w-28 rounded-[18px] bg-[#f3f4f6]" /><div className="absolute right-10 top-20 h-10 w-24 rounded-[18px] bg-[#f3f4f6]" /><div className="absolute bottom-8 left-8 h-12 w-28 rounded-[18px] bg-[#f3f4f6]" /></div><div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#5d1a80] text-white shadow-lg shadow-violet-200/80"><MapPin size={20} className="text-white" /></div><div className="absolute right-4 top-4 flex items-center gap-2"><button type="button" onClick={() => setActiveDeliveryIndex(index)} className="inline-flex items-center gap-2 rounded-full border border-[#1f9d94] bg-[#f0fdfa] px-3 py-2 text-xs font-semibold text-[#0f766e] shadow-sm transition-transform hover:scale-[1.02]" aria-label="Edit address"><PencilLine size={14} />Edit</button></div><div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-700 shadow-sm"><span className="h-2 w-2 rounded-full bg-[#5d1a80]" />{delivery.title || (index === 0 ? "Home" : "Address")}</div>{index === 0 && <span className="rounded-full bg-[#0f172a] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">Default</span>}</div></div>
              <div className="space-y-3 p-3"><p className="block overflow-hidden text-ellipsis whitespace-nowrap text-[15px] leading-7 text-slate-700">{delivery.address || "No address selected yet"}</p><div className="space-y-2 border-t border-slate-100 pt-3"><div className="flex items-center gap-2 px-2 text-sm text-slate-600"><Phone size={16} className="text-[#0f766e]" /><span>{profilePhone}</span></div><button type="button" onClick={() => setConfirmDelete({ index, label: delivery.title || `Address ${index + 1}` })} disabled={deletingIndex === index} className="w-full rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{deletingIndex === index ? "Removing..." : "Remove address"}</button></div></div>
            </div>)}
          </div> : <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center"><MapPin size={32} className="mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-500">No delivery addresses saved yet</p></div>}
        </div>
      </div>

      {activeDeliveryIndex !== null && <AddressSelectModal open={true} onClose={() => setActiveDeliveryIndex(null)} onSelect={handleAddressSelect} redirectTo={null} existingAddressId={addresses[activeDeliveryIndex]?.addressId || null} customTitle={addresses[activeDeliveryIndex]?.title || undefined} />}
      {confirmDelete && <ConfirmDialog open={true} onClose={() => setConfirmDelete(null)} onConfirm={handleRemoveAddress} title="Remove address?" message={`Are you sure you want to remove "${confirmDelete.label}"? This action cannot be undone.`} confirmText="Remove" cancelText="Keep" variant="danger" />}
    </>
  );
}
