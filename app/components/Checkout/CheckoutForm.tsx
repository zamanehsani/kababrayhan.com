import React, { useState, useEffect } from "react";
import AddressSelectModal from "../home/modal/AddressSelectModal";

export type DeliveryAddressItem = {
  id?: string;
  title: string;
  address: string;
  addressId: string;
};

interface CheckoutFormProps {
  form: { phone: string; address: string; deliveryAddresses: DeliveryAddressItem[] };
  setForm: React.Dispatch<React.SetStateAction<{ phone: string; address: string; deliveryAddresses: DeliveryAddressItem[] }>>;
  error: string | null;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  form,
  setForm,
  error,
}) => {
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem("uae_phone");
    const savedAddress = localStorage.getItem("uae_address");

    // Try to load multi-address data first, fall back to single address
    const rawDelivery = localStorage.getItem("uae_delivery_addresses");
    let deliveryAddresses: DeliveryAddressItem[];
    if (rawDelivery) {
      try {
        deliveryAddresses = JSON.parse(rawDelivery);
      } catch {
        deliveryAddresses = [{
          title: "Home",
          address: localStorage.getItem("uae_delivery_address") || localStorage.getItem("uae_address") || "",
          addressId: localStorage.getItem("uae_delivery_address_id") || localStorage.getItem("uae_address_id") || "",
        }];
      }
    } else {
      deliveryAddresses = [{
        title: "Home",
        address: localStorage.getItem("uae_delivery_address") || localStorage.getItem("uae_address") || "",
        addressId: localStorage.getItem("uae_delivery_address_id") || localStorage.getItem("uae_address_id") || "",
      }];
    }

    if (savedPhone || savedAddress || deliveryAddresses.some(d => d.address)) {
      setForm((prev) => ({
        ...prev,
        phone: savedPhone || prev.phone,
        address: savedAddress || prev.address,
        deliveryAddresses: deliveryAddresses.some(d => d.address) ? deliveryAddresses : prev.deliveryAddresses,
      }));
    }
  }, [setForm]);

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-stone-100">
      <h2 className="mb-8 text-xl font-medium tracking-wide text-stone-900 flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-brand-400" />
        Delivery Details
      </h2>

      <div className="space-y-8">
        {/* Contact Phone Row */}
        <div className="group">
          <label className="mb-3 ml-1 block text-[13px] font-medium uppercase tracking-wide text-stone-400">
            Contact Phone
          </label>
          <div className="flex items-center gap-4 rounded-2xl border-2 border-stone-50 bg-stone-50/50 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-green-600">Verified</span>
              <span className="font-medium text-stone-900">{form.phone}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address Cards (dynamic, multi-address) */}
        {form.deliveryAddresses.map((delivery, index) => (
        <div key={delivery.id ?? String(index)} className="group">
            {/* Label row with inline editable title */}
            <div className="mb-3 ml-1 flex items-center gap-1">
              <span className="text-[13px] font-medium uppercase tracking-wide text-stone-400 group-hover:text-brand-400 transition-colors">
                Delivery To&nbsp;(
              </span>
              <input
                type="text"
                value={delivery.title}
                onChange={(e) => {
                  const updated = form.deliveryAddresses.map((da, i) =>
                    i === index ? { ...da, title: e.target.value } : da
                  );
                  setForm(prev => ({ ...prev, deliveryAddresses: updated }));
                  localStorage.setItem("uae_delivery_addresses", JSON.stringify(updated));
                }}
                placeholder={index === 0 ? "Home" : "Office, Work…"}
                className="text-[13px] font-medium uppercase tracking-wide text-stone-600 bg-transparent border-b border-dashed border-stone-300 focus:border-brand-400 focus:outline-none w-20 text-center placeholder:text-stone-300"
              />
              <span className="text-[13px] font-medium uppercase tracking-wide text-stone-400 group-hover:text-brand-400 transition-colors">
                )
              </span>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = form.deliveryAddresses.filter((_, i) => i !== index);
                    setForm(prev => ({ ...prev, deliveryAddresses: updated }));
                    localStorage.setItem("uae_delivery_addresses", JSON.stringify(updated));
                  }}
                  className="ml-auto text-[11px] font-medium uppercase tracking-wide text-stone-300 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div
              className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 p-5 transition-all ${
                delivery.address
                  ? "border-stone-100 bg-white shadow-xl shadow-stone-200/40"
                  : "border-dashed border-stone-200 bg-stone-50"
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                  delivery.address ? "bg-red-50 text-brand-400" : "bg-stone-200 text-stone-400"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.152-.722c1.102-.74 2.499-1.856 3.635-3.456 1.137-1.6 1.832-3.41 1.832-5.212 0-4.72-3.8-8.502-8.514-8.502-4.714 0-8.514 3.782-8.514 8.502 0 1.802.695 3.612 1.832 5.212 1.136 1.6 2.533 2.716 3.635 3.456a16.977 16.977 0 001.152.722zM12.75 12a.75.75 0 01-.75.75 2.25 2.25 0 110-4.5.75.75 0 01.75.75v3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-sm font-medium leading-snug ${delivery.address ? "text-stone-900" : "text-stone-400 italic"}`}>
                    {delivery.address || "Select your delivery location..."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDeliveryIndex(index)}
                className={`w-full sm:w-auto shrink-0 rounded-xl px-4 py-2 text-[13px] font-medium uppercase tracking-widest transition-all active:scale-95 ${
                  delivery.address
                    ? "bg-stone-100 text-stone-600 hover:bg-brand-400 hover:text-white"
                    : "bg-brand-400 text-white shadow-lg shadow-red-200"
                }`}
              >
                {delivery.address ? "Edit" : "Select"}
              </button>
            </div>
          </div>
        ))}

        {/* Add another delivery address */}
        <button
          type="button"
          onClick={() => {
            const updated = [...form.deliveryAddresses, { id: String(Date.now()), title: "", address: "", addressId: "" }];
            setForm(prev => ({ ...prev, deliveryAddresses: updated }));
            localStorage.setItem("uae_delivery_addresses", JSON.stringify(updated));
          }}
          className="flex items-center gap-2 ml-1 text-[13px] font-medium uppercase tracking-wide text-stone-400 hover:text-brand-400 transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Delivery Address
        </button>
      </div>

      {error && (
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-xs font-medium text-brand-400 ring-1 ring-red-100 animate-in fade-in slide-in-from-top-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Delivery Address Selection Modal (index-based) */}
      {activeDeliveryIndex !== null && (
        <AddressSelectModal
          open={true}
          onClose={() => setActiveDeliveryIndex(null)}
          addressType="Billing"
          skipCustomerCreation={activeDeliveryIndex > 0}
          redirectTo={null}
          customTitle={form.deliveryAddresses[activeDeliveryIndex]?.title || `delivery-${activeDeliveryIndex + 1}`}
          onSelect={(addressData) => {
            const resolvedAddress = addressData.name || "";
            const addressId = addressData.id;
            const updated = form.deliveryAddresses.map((da, i) =>
              i === activeDeliveryIndex ? { ...da, address: resolvedAddress, addressId } : da
            );
            setForm(prev => ({ ...prev, deliveryAddresses: updated }));
            localStorage.setItem("uae_delivery_addresses", JSON.stringify(updated));
            // Keep primary keys in sync — primary address also acts as the billing address for ERPNext
            if (activeDeliveryIndex === 0) {
              localStorage.setItem("uae_delivery_address", resolvedAddress);
              localStorage.setItem("uae_delivery_address_id", addressId);
              localStorage.setItem("uae_address", resolvedAddress);
              localStorage.setItem("uae_address_id", addressId);
            }
          }}
        />
      )}
    </section>
  );
};

export default CheckoutForm;
