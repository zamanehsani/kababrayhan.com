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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ScrollRestoration />
        <Providers>
          <div className="block md:hidden"><MobileHeader /></div>
          <div className="hidden md:block lg:hidden"><TabletHeader /></div>
          <div className="hidden lg:block"><DesktopHeader /></div>
          {children}
          <Footer />
          <CartSidebarWidget />
        </Providers>
      </body>
    </html>
  );
}
