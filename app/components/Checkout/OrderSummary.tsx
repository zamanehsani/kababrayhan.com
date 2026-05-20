import React from "react";

interface CartEntry {
  item: {
    id: string;
    title: string;
    image: string;
    discountedPrice: number;
  };
  qty: number;
  addon?: {
    title: string;
  };
}

interface OrderSummaryProps {
  cart: CartEntry[];
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, total }) => {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {/* Header with Red Accent */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-brand-400" />
          <h2 className="text-xl font-black tracking-tight text-stone-900">
            Your Order
          </h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-500">
          {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {/* Item List */}
      <div className="space-y-5">
        {cart.map((entry, idx) => (
          <div
            key={entry.item?.id ? `${entry.item.id}-${idx}` : idx}
            className="group flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-stone-50 bg-stone-50">
                <img
                  src={entry.item?.image}
                  alt={entry.item?.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-900 leading-tight">
                  <span className="text-brand-400">{entry.qty || 1}x</span> {entry.item?.title}
                </div>
                {entry.addon?.title && (
                  <div className="mt-1 text-[11px] font-medium text-stone-400">
                    + {entry.addon.title}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-black text-stone-900">
                AED {((entry.item?.discountedPrice || 0) * (entry.qty || 1)).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Breakdown */}
      <div className="mt-8 space-y-3 border-t border-stone-100 pt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-stone-500">Subtotal</span>
          <span className="font-bold text-stone-900">AED {total.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-stone-500">Delivery Fee</span>
          <span className="font-bold text-emerald-600 uppercase text-[10px] tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
            Free
          </span>
        </div>
        
        {/* Total Highlight */}
        <div className="mt-6 flex items-center justify-between rounded-[2rem] bg-stone-900 p-6 shadow-xl shadow-stone-200">
          <span className="text-base font-bold text-white uppercase tracking-widest">Total</span>
          <div className="text-right">
            <span className="block text-2xl font-black text-red-500 leading-none">
              AED {total.toFixed(2)}
            </span>
            <span className="mt-1 block text-[10px] font-bold text-stone-500 uppercase tracking-tighter">
              VAT Included
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSummary;


// import React from "react";

// interface CartEntry {
//   item: {
//     id: string;
//     title: string;
//     image: string;
//     discountedPrice: number;
//   };
//   qty: number;
//   addon?: {
//     title: string;
//   };
// }

// interface OrderSummaryProps {
//   cart: CartEntry[];
//   total: number;
// }

// const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, total }) => {
//   return (
//     <section className="rounded-3xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
//       <div className="mb-6 flex items-center justify-between">
//         <h2 className="text-xl font-black tracking-tight text-stone-900">
//           Your Order
//         </h2>
//         <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-500">
//           {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
//         </span>
//       </div>

//       <div className="space-y-4">
//         {cart.map((entry, idx) => (
//           <div
//             key={entry.item?.id ? `${entry.item.id}-${idx}` : idx}
//             className="group flex items-center justify-between gap-4"
//           >
//             <div className="flex items-center gap-4">
//               <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-stone-50">
//                 <img
//                   src={entry.item?.image}
//                   alt={entry.item?.title}
//                   className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
//                 />
//               </div>
//               <div>
//                 <div className="text-sm font-bold text-stone-900 leading-tight">
//                   <span className="text-amber-500">{entry.qty || 1}x</span> {entry.item?.title}
//                 </div>
//                 {entry.addon?.title && (
//                   <div className="mt-1 text-[11px] font-medium text-stone-400">
//                     + {entry.addon.title}
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             <div className="text-right">
//               <div className="text-sm font-black text-stone-900">
//                 AED {((entry.item?.discountedPrice || 0) * (entry.qty || 1)).toFixed(2)}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pricing Breakdown */}
//       <div className="mt-8 space-y-3 border-t border-stone-50 pt-6">
//         <div className="flex items-center justify-between text-sm">
//           <span className="font-medium text-stone-400">Subtotal</span>
//           <span className="font-bold text-stone-900">AED {total.toFixed(2)}</span>
//         </div>
//         <div className="flex items-center justify-between text-sm">
//           <span className="font-medium text-stone-400">Delivery</span>
//           <span className="font-bold text-emerald-500 uppercase text-[10px] tracking-widest">Free</span>
//         </div>
        
//         <div className="mt-4 flex items-center justify-between rounded-2xl bg-stone-50 p-4">
//           <span className="text-base font-black text-stone-900">Total</span>
//           <div className="text-right">
//             <span className="block text-2xl font-black text-amber-500 leading-none">
//               AED {total.toFixed(2)}
//             </span>
//             <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
//               VAT Included
//             </span>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default OrderSummary;