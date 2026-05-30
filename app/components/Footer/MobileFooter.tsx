"use client";

import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "../icon/SocialIcons";

export default function MobileFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 pt-8 pb-20">
      <div className="px-4">
        {/* Brand Section */}
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-semibold tracking-wide text-yellow-400 mb-2">
            Kabab Al Raihan
          </h3>
          <p className="text-sm text-slate-400 tracking-wide">
            Authentic flavors, delivered fresh
          </p>
        </div>

        {/* Contact Info */}
        <div className="mb-6 space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <MapPin size={18} className="text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-300 leading-relaxed">
                Dubai, United Arab Emirates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Phone size={18} className="text-yellow-400 shrink-0" />
            <a href="tel:+971XXXXXXXXX" className="text-slate-300 hover:text-yellow-400 transition-colors">
              +971 XX XXX XXXX
            </a>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Mail size={18} className="text-yellow-400 shrink-0" />
            <a href="mailto:info@kababalraihan.ae" className="text-slate-300 hover:text-yellow-400 transition-colors">
              info@kababalraihan.ae
            </a>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <Clock size={18} className="text-yellow-400 mt-0.5 shrink-0" />
            <div className="text-slate-300">
              <p>Daily: 10:00 AM - 11:00 PM</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-6 py-4 border-y border-slate-800">
          <h4 className="text-sm font-semibold text-slate-200 mb-3 tracking-wide">
            Quick Links
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/home" className="text-sm text-slate-400 hover:text-yellow-400 transition-colors">
              Home
            </Link>
            <Link href="/my-orders" className="text-sm text-slate-400 hover:text-yellow-400 transition-colors">
              My Orders
            </Link>
            <Link href="/account-profile" className="text-sm text-slate-400 hover:text-yellow-400 transition-colors">
              Profile
            </Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-yellow-400 transition-colors">
              About Us
            </Link>
          </div>
        </div>

        {/* Social Media */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-200 mb-3 tracking-wide text-center">
            Follow Us
          </h4>
          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
              aria-label="Facebook"
            >
              <FacebookIcon size={18} />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
              aria-label="Instagram"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
              aria-label="YouTube"
            >
              <YoutubeIcon size={18} />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
              aria-label="Twitter"
            >
              <TwitterIcon size={18} />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 tracking-wide">
            &copy; {currentYear} Kabab Al Raihan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
