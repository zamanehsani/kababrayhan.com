import DesktopCategoryTabs from "../CategoryTabs.tsx/DesktopCategoryTabs";
import MobileCategoryTabs from "../CategoryTabs.tsx/MobileCategoryTabs";
import TabletCategoryTabs from "../CategoryTabs.tsx/TabletCategoryTabs";


export default function CategoryTabs() {
  return (
    <>
      {/* 1. Mobile Interface: Visible below 768px screen sizes */}
      <div className="block md:hidden">
        <MobileCategoryTabs />
      </div>

      {/* 2. Tablet Interface: Visible between 768px and 1023px screens */}
      <div className="hidden md:block lg:hidden">
        <TabletCategoryTabs />
      </div>

      {/* 3. Laptop/Desktop Interface: Visible from 1024px and upwards */}
      <div className="hidden lg:block">
        <DesktopCategoryTabs />
      </div>
    </>
  );
}

// import { Pizza, Beer, Beef, ChevronRight } from "lucide-react";

// export default function CategoryTabs() {
//   const categories = [
//     { name: "All", active: true },
//     { name: "Burger", icon: <Beef size={18} />, active: false },
//     { name: "Pizza", icon: <Pizza size={18} />, active: false },
//     { name: "Drink", icon: <Beer size={18} />, active: false },
//   ];

//   return (
//     <section className="mt-8">
//       {/* Header Section */}
//       <div className="mb-4 flex items-center justify-between px-4">
//         <h3 className="text-xl font-semibold tracking-tight text-slate-900">
//           Categories
//         </h3>
//         <button className="flex items-center gap-1 text-sm font-medium text-slate-500 active:opacity-70">
//           See all
//           <ChevronRight size={14} />
//         </button>
//       </div>

//       {/* Categories Scroll */}
//       <div className="flex gap-3 overflow-hidden px-4 pb-4 no-scrollbar">
//         {categories.map((cat) => (
//           <button
//             key={cat.name}
//             className={`flex items-center gap-2.5 whitespace-nowrap rounded-full px-5 py-3 transition-all ${
//               cat.active
//                 ? "bg-yellow-400 text-slate-900 shadow-md shadow-yellow-200/50"
//                 : "border border-slate-100 bg-white text-slate-600 active:bg-slate-50"
//             }`}
//           >
//             {/* Icon color logic */}
//             {cat.icon && (

//               <span className={cat.active ? "text-slate-900" : "text-slate-400"}>
//               {cat.icon}
//             </span>
//             )}

//             {/* Typography: Using text-sm and font-semibold for a cleaner look */}
//             <span className="text-sm font-semibold tracking-wide">
//               {cat.name}
//             </span>
//           </button>
//         ))}
//       </div>
//     </section>
//   );
// }
