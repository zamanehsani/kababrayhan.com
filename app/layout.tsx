import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ScrollRestoration from "./components/scrollrestoration";
import MobileHeader from "./components/Header/MobileHeader";
import TabletHeader from "./components/Header/TabletHeader";
import DesktopHeader from "./components/Header/DesktopHeader";
import Footer from "./components/Footer/Footer";
import CartSidebarWidget from "./components/Cart/CartSidebarWidget";
import { fetchCompanyInfo } from "./lib/company";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kabab AlRayhan Restaurant & Bekery",
  description: "A restaurant and bakery located in Ajman, United Arab Emirates, offering a variety of delicious dishes and baked goods.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const company = await fetchCompanyInfo();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ScrollRestoration />
        <Providers>
          <div className="block md:hidden"><MobileHeader companyName={company.name} logoSrc={company.logoDataUrl} /></div>
          <div className="hidden md:block lg:hidden"><TabletHeader /></div>
          <div className="hidden lg:block"><DesktopHeader companyName={company.name} logoSrc={company.logoDataUrl} /></div>
          {children}
          <Footer company={company} />
          <CartSidebarWidget />
        </Providers>
      </body>
    </html>
  );
}
