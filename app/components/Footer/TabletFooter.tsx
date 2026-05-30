"use client";

import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "../icon/SocialIcons";

export default function TabletFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 pt-12 pb-24">
      <div className="px-8 max-w-7xl mx-auto">
        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Brand & Contact Section */}
          <div>
            <h3 className="text-3xl font-semibold tracking-wide text-yellow-400 mb-3">
              Kabab Al Raihan
            </h3>
            <p className="text-base text-slate-400 tracking-wide mb-6">
              Authentic flavors, delivered fresh
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-300 leading-relaxed">
                    Dubai, United Arab Emirates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone size={20} className="text-yellow-400 shrink-0" />
                <a href="tel:+971XXXXXXXXX" className="text-slate-300 hover:text-yellow-400 transition-colors">
                  +971 XX XXX XXXX
                </a>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail size={20} className="text-yellow-400 shrink-0" />
                <a href="mailto:info@kababalraihan.ae" className="text-slate-300 hover:text-yellow-400 transition-colors">
                  info@kababalraihan.ae
                </a>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Clock size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                <div className="text-slate-300">
                  <p>Daily: 10:00 AM - 11:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links & Social */}
          <div className="space-y-8">
            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-slate-200 mb-4 tracking-wide">
                Quick Links
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/home" className="text-base text-slate-400 hover:text-yellow-400 transition-colors">
                  Home
                </Link>
                <Link href="/my-orders" className="text-base text-slate-400 hover:text-yellow-400 transition-colors">
                  My Orders
                </Link>
                <Link href="/account-profile" className="text-base text-slate-400 hover:text-yellow-400 transition-colors">
                  Profile
                </Link>
                <Link href="#" className="text-base text-slate-400 hover:text-yellow-400 transition-colors">
                  About Us
                </Link>
                <Link href="#" className="text-base text-slate-400 hover:text-yellow-400 transition-colors">
                  Contact
                </Link>
                <Link href="#" className="text-base text-slate-400 hover:text-yellow-400 transition-colors">
                  Terms
                </Link>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-lg font-semibold text-slate-200 mb-4 tracking-wide">
                Follow Us
              </h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
                  aria-label="Facebook"
                >
                  <FacebookIcon size={20} />
                </a>
                <a
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
                  aria-label="Instagram"
                >
                  <InstagramIcon size={20} />
                </a>
                <a
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
                  aria-label="YouTube"
                >
                  <YoutubeIcon size={20} />
                </a>
                <a
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
                  aria-label="Twitter"
                >
                  <TwitterIcon size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800">
          <p className="text-sm text-slate-500 tracking-wide text-center">
            &copy; {currentYear} Kabab Al Raihan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
