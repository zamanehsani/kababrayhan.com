"use client";

import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "../icon/SocialIcons";

export default function DesktopFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-12">
        {/* Main Content Grid */}
        <div className="grid grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1">
            <h3 className="text-3xl font-semibold tracking-wide text-yellow-400 mb-3">
              Kabab Al Raihan
            </h3>
            <p className="text-sm text-slate-400 tracking-wide leading-relaxed">
              Authentic flavors, delivered fresh to your doorstep. Experience the taste of tradition.
            </p>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold text-slate-200 mb-6 tracking-wide">
              Contact Us
            </h4>
            <div className="space-y-4">
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
                <a href="mailto:info@kababalraihan.ae" className="text-slate-300 hover:text-yellow-400 transition-colors break-all">
                  info@kababalraihan.ae
                </a>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Clock size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                <div className="text-slate-300">
                  <p className="font-semibold mb-1">Opening Hours</p>
                  <p>Daily: 10:00 AM - 11:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold text-slate-200 mb-6 tracking-wide">
              Quick Links
            </h4>
            <div className="space-y-3">
              <Link href="/home" className="block text-sm text-slate-400 hover:text-yellow-400 transition-colors">
                Home
              </Link>
              <Link href="/my-orders" className="block text-sm text-slate-400 hover:text-yellow-400 transition-colors">
                My Orders
              </Link>
              <Link href="/account-profile" className="block text-sm text-slate-400 hover:text-yellow-400 transition-colors">
                Profile
              </Link>
              <Link href="#" className="block text-sm text-slate-400 hover:text-yellow-400 transition-colors">
                About Us
              </Link>
              <Link href="#" className="block text-sm text-slate-400 hover:text-yellow-400 transition-colors">
                Contact
              </Link>
              <Link href="#" className="block text-sm text-slate-400 hover:text-yellow-400 transition-colors">
                Terms & Conditions
              </Link>
              <Link href="#" className="block text-sm text-slate-400 hover:text-yellow-400 transition-colors">
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
                href="#"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <FacebookIcon size={20} />
              </a>
              <a
                href="#"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <InstagramIcon size={20} />
              </a>
              <a
                href="#"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all hover:scale-110"
                aria-label="YouTube"
              >
                <YoutubeIcon size={20} />
              </a>
              <a
                href="#"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <TwitterIcon size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 tracking-wide">
            &copy; {currentYear} Kabab Al Raihan. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="#" className="hover:text-yellow-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-yellow-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-yellow-400 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
