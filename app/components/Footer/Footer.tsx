import DesktopFooter from "./DesktopFooter";
import MobileFooter from "./MobileFooter";
import TabletFooter from "./TabletFooter";

export default function Footer() {
  return (
    <>
      {/* 1. Mobile Version: Rendered on mobile screens, hidden on tablet md (768px+) */}
      <div className="block md:hidden">
        <MobileFooter />
      </div>

      {/* 2. Tablet Version: Rendered strictly between 768px and 1023px viewports */}
      <div className="hidden md:block lg:hidden">
        <TabletFooter />
      </div>

      {/* 3. Desktop Version: Rendered permanently from 1024px upwards */}
      <div className="hidden lg:block">
        <DesktopFooter />
      </div>
    </>
  );
}
