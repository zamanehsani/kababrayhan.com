import { Mail, PencilLine, Phone, UserRound } from "lucide-react";
import type { CustomerDetails } from "@/app/redux/apiType";

type ProfileTabProps = {
  customerProfile?: CustomerDetails;
  fullName: string;
  emailAddress: string;
  profilePhone: string;
  onEditEmail: () => void;
  onEditPhone: () => void;
};

export default function ProfileTab({
  customerProfile,
  fullName,
  emailAddress,
  profilePhone,
  onEditEmail,
  onEditPhone,
}: ProfileTabProps) {
  return (
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
              onClick={onEditEmail}
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
              onClick={onEditPhone}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-red-200 hover:text-red-600"
              aria-label="Edit phone"
            >
              <PencilLine size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
