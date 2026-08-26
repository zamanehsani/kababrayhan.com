"use client";

import { MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsappIcon,
  TiktokIcon,
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

export default function MobileFooter({
  company = DEFAULT_COMPANY_INFO,
}: Readonly<{ company?: CompanyInfo }>) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 pt-8 pb-20">
      <div className="px-4">
        {/* Brand Section */}
        <div className="mb-6 text-center">
          {/* Centered Image Base Logo for Mobile */}
          <div className="relative h-20 w-20 mx-auto mb-3">
            <Image
              src={company.logoDataUrl || "/log-white.png"}
              alt={`${company.name} Logo`}
              fill
              priority
              className="object-contain"
            />
          </div>

          <p className="text-sm text-slate-400 tracking-wide">
            {company.description}
          </p>
        </div>

        {/* Contact Info */}
        <div className="mb-6 space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <MapPin size={18} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-300 leading-relaxed">
                {company.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Phone size={18} className="text-red-600 shrink-0" />
            <a
              href={`tel:${company.phone.replaceAll(/\s+/g, "")}`}
              className="text-slate-300 hover:text-red-600 transition-colors"
            >
              {company.phone}
            </a>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Mail size={18} className="text-red-600 shrink-0" />
            <a
              href={`mailto:${company.email}`}
              className="text-slate-300 hover:text-red-600 transition-colors"
            >
              {company.email}
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-6 py-4 border-y border-slate-800">
          <h4 className="text-sm font-normal text-slate-200 mb-3 tracking-wide">
            Quick Links
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-red-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/my-orders"
              className="text-sm text-slate-400 hover:text-red-600 transition-colors"
            >
              My Orders
            </Link>
            <Link
              href="/account-profile"
              className="text-sm text-slate-400 hover:text-red-600 transition-colors"
            >
              Profile
            </Link>
            <Link href="/terms-conditions" className="text-sm text-slate-400 hover:text-red-600 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" className="text-sm text-slate-400 hover:text-red-600 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Social Media */}
        <div className="mb-6">
          <h4 className="text-sm font-normal text-slate-200 mb-3 tracking-wide text-center">
            Follow Us
          </h4>
          <div className="flex justify-center gap-4">
            <a
              href="https://www.facebook.com/Kababalrayhan"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all"
              aria-label="Facebook"
            >
              <FacebookIcon size={18} />
            </a>
            <a
              href="https://www.instagram.com/kabab_alrayhan/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all"
              aria-label="Instagram"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href="https://www.tiktok.com/@kabab.alrayhan"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all"
              aria-label="TikTok"
            >
              <TiktokIcon size={18} />
            </a>
            <a
              href="https://wa.me/971503021317?text=Hello!%20I%20have%20a%20question%20about%20your%20services."
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all"
              aria-label="WhatsApp"
            >
              <WhatsappIcon size={18} />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col items-center gap-2 border-t border-slate-800 pt-4 text-center">
          <p className="text-xs tracking-wide text-slate-500">
            &copy; {currentYear} Kabab Al Raihan. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
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
