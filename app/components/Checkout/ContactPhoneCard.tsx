import React from "react";
import PhoneIcon from "../icon/PhoneIcon";


interface ContactPhoneCardProps {
  phone: string;
}

const ContactPhoneCard: React.FC<ContactPhoneCardProps> = ({
  phone,
}) => {
  return (
    <div className="group">
      <label className="mb-3 ml-1 block text-[13px] font-medium uppercase tracking-wide text-stone-400">
        Contact Phone
      </label>

      <div className="flex items-center gap-4 rounded-2xl border-2 border-stone-50 bg-stone-50/50 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm">
          <PhoneIcon />
        </div>

        <div className="flex flex-1 flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-green-600">
            Verified
          </span>

          <span className="font-medium text-stone-900">
            {phone}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContactPhoneCard;