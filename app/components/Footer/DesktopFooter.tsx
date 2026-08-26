"use client";

import { MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
} from "../icon/SocialIcons";
import Image from "next/image";
import type { CompanyInfo } from "@/app/lib/company";

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "Kabab Al Rayhan",
  description:
    "Authentic Persian & Iranian grill experience in the heart of Ajman. From our signature Qabuli polou to the legendary Tikka Masti, we bring tradition to your table.",
  phone: "+971503021317",
  email: "kababrayhan@gmail.com",
  address: "Al Rawda 2 - Ajman - United Arab Emirates",
  logoDataUrl: null,
};

export default function DesktopFooter({
  company = DEFAULT_COMPANY_INFO,
}: Readonly<{ company?: CompanyInfo }>) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-12">
        {/* Main Content Grid */}
        <div className="grid grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}

          <div className="col-span-1">
            {/* Image wrapper with a fixed height, keeping the layout sharp */}
            <div className="relative h-22 w-58 mb-4">
              <Image
                src={company.logoDataUrl || "/log-white.png"}
                alt={`${company.name} Logo`}
                fill
                priority // Ensures the logo loads instantly without layout shifts
                className="object-contain object-left " // Keeps aspect ratio perfect and left-aligned
              />
            </div>
            <p className="text-sm text-slate-400 tracking-wide leading-relaxed">
              {company.description}
            </p>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold text-slate-200 mb-6 tracking-wide">
              Contact Us
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={20} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-300 leading-relaxed">
                    {company.address}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone size={20} className="text-red-600 shrink-0" />
                <a
                  href={`tel:${company.phone.replaceAll(/\s+/g, "")}`}
                  className="text-slate-300 hover:text-red-600 transition-colors"
                >
                  {company.phone}
                </a>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail size={20} className="text-red-600 shrink-0" />
                <a
                  href={`mailto:${company.email}`}
                  className="text-slate-300 hover:text-red-600 transition-colors break-all"
                >
                  {company.email}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold text-slate-200 mb-6 tracking-wide">
              Quick Links
            </h4>
            <div className="space-y-3">
              <Link
                href="/"
                className="block text-sm text-slate-400 hover:text-red-600 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/my-orders"
                className="block text-sm text-slate-400 hover:text-red-600 transition-colors"
              >
                My Orders
              </Link>
              <Link
                href="/account-profile"
                className="block text-sm text-slate-400 hover:text-red-600 transition-colors"
              >
                Profile
              </Link>
              {/* <Link href="#" className="block text-sm text-slate-400 hover:text-red-600 transition-colors">
                About Us
              </Link> */}
              {/* <Link href="#" className="block text-sm text-slate-400 hover:text-red-600 transition-colors">
                Contact
              </Link> */}
              <Link href="/terms-conditions" className="block text-sm text-slate-400 hover:text-red-600 transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/privacy-policy" className="block text-sm text-slate-400 hover:text-red-600 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Social Media */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold text-slate-200 mb-6 tracking-wide">
              Follow Us
            </h4>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Stay connected for the latest updates and exclusive offers.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/Kababalrayhan"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <FacebookIcon size={20} />
              </a>
              <a
                href="https://www.instagram.com/kabab_alrayhan/"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <InstagramIcon size={20} />
              </a>
              <a
                href="https://www.tiktok.com/@kabab.alrayhan"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all hover:scale-110"
                aria-label="TikTok"
              >
                <TiktokIcon size={24} />
              </a>
              <a
                href="https://wa.me/971503021317?text=Hello!%20I%20have%20a%20question%20about%20your%20services."
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all hover:scale-110"
                aria-label="WhatsApp"
              >
                <WhatsappIcon size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-8">
          <p className="text-sm tracking-wide text-slate-500">
            &copy; {currentYear} Kabab Al Raihan. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">
            made by{" "}
            <a
              href="https://www.coderhq.co"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 transition-colors hover:text-red-600"
            >
              coderhq.co
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
