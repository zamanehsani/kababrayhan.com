export default function ThankYouPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
        Payment complete
      </span>
      <h1 className="mt-4 text-4xl font-black text-slate-900">
        Thank you for your order!
      </h1>
      <p className="mt-4 max-w-xl text-sm text-slate-500">
        Your order is confirmed and being prepared. You can return to the menu
        to continue browsing.
      </p>
      <a
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
      >
        Back to menu
      </a>
    </main>
  );
}
