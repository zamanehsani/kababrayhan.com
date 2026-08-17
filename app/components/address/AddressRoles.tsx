
import React from "react";

interface AddressRolesProps {
  isDelivery: boolean;
  isBilling: boolean;
  onToggleDelivery?: () => void;
  onToggleBilling?: () => void;
}

const AddressRoles: React.FC<AddressRolesProps> = ({
  isDelivery,
  isBilling,
}) => {
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isDelivery ? "bg-emerald-500" : "bg-stone-300"
          }`}
        />
        Delivery Address
      </div>

      <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isBilling ? "bg-amber-500" : "bg-stone-300"
          }`}
        />
        Billing Address
      </div>
    </div>
  );
};

export default AddressRoles;