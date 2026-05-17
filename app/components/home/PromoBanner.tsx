import DesktopPromoBanner from "../Banner/DesktopPromoBanner";
import MobilePromoBanner from "../Banner/MobilePromoBanner";
import TabletPromoBanner from "../Banner/TabletPromoBanner";


export default function PromoBanner() {
  return (
    <>
      {/* 1. Mobile Version: Rendered on micro screens, hidden on tablet md (768px+) */}
      <div className="block md:hidden">
        <MobilePromoBanner />
      </div>

      {/* 2. Tablet Version: Rendered strictly between 768px and 1023px viewports */}
      <div className="hidden md:block lg:hidden">
        <TabletPromoBanner />
      </div>

      {/* 3. Laptop/Desktop Version: Rendered permanently from 1024px upwards */}
      <div className="hidden lg:block">
        <DesktopPromoBanner />
      </div>
    </>
  );
}
