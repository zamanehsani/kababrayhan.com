import DesktopFooter from "./DesktopFooter";
import MobileFooter from "./MobileFooter";
import TabletFooter from "./TabletFooter";
import type { CompanyInfo } from "@/app/lib/company";

// Fallback used by pages that render Footer without fetching company info server-side.
const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "Kabab Al Rayhan",
  description:
    "Authentic Persian & Iranian grill experience in the heart of Ajman. From our signature Qabuli polou to the legendary Tikka Masti, we bring tradition to your table.",
  phone: "+971503021317",
  email: "kababrayhan@gmail.com",
  address: "Al Rawda 2 - Ajman - United Arab Emirates",
  logoDataUrl: null,
};

export default function Footer({
  company = DEFAULT_COMPANY_INFO,
}: Readonly<{ company?: CompanyInfo }>) {
  return (
    <>
      {/* 1. Mobile Version: Rendered on mobile screens, hidden on tablet md (768px+) */}
      <div className="block md:hidden">
        <MobileFooter company={company} />
      </div>

      {/* 2. Tablet Version: Rendered strictly between 768px and 1023px viewports */}
      <div className="hidden md:block lg:hidden">
        <TabletFooter company={company} />
      </div>

      {/* 3. Desktop Version: Rendered permanently from 1024px upwards */}
      <div className="hidden lg:block">
        <DesktopFooter company={company} />
      </div>
    </>
  );
}
