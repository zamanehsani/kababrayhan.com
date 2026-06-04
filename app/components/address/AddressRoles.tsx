
import React from "react";

interface AddressRolesProps {
  isDelivery: boolean;
  isBilling: boolean;
  onToggleDelivery: () => void;
  onToggleBilling: () => void;
}

const AddressRoles: React.FC<AddressRolesProps> = ({
  isDelivery,
  isBilling,
  onToggleDelivery,
  onToggleBilling,
}) => {
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <label className="flex items-center gap-2 text-xs font-medium text-stone-600">
        <input
          type="checkbox"
          checked={isDelivery}
          onChange={onToggleDelivery}
          className="h-4 w-4 rounded border-stone-300 text-red-600 focus:ring-red-500"
        />
        Delivery Address
      </label>

      <label className="flex items-center gap-2 text-xs font-medium text-stone-600">
        <input
          type="checkbox"
          checked={isBilling}
          onChange={onToggleBilling}
          className="h-4 w-4 rounded border-stone-300 text-red-600 focus:ring-red-500"
        />
        Billing Address
      </label>
    </div>
  );
};

export default AddressRoles;