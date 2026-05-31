"use client";

import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Link from "next/link";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsappIcon,
  TiktokIcon,
} from "../icon/SocialIcons";
import Image from "next/image";

export default function TabletFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 pt-12 pb-24">
      <div className="px-8 max-w-7xl mx-auto">
        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Brand & Contact Section */}

          <div>
            {/* Left-aligned Image Base Logo for Tablet */}
            <div className="relative h-24 w-24 mb-4">
              <Image
                src="/log-white.png"
                alt="Kabab Al Raihan Logo"
                fill
                priority
                className="object-contain object-left"
              />
            </div>

            <p className="text-base text-slate-400 tracking-wide mb-6">
              Authentic Persian & Iranian grill experience in the heart of
              Ajman. From our signature Qabuli polou to the legendary Tikka
              Masti, we bring tradition to your table.
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
                <a
                  href="tel:+971503021317"
                  className="text-slate-300 hover:text-yellow-400 transition-colors"
                >
                  +971 50 302 1317
                </a>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail size={20} className="text-yellow-400 shrink-0" />
                <a
                  href="mailto:kababrayhan@gmail.com"
                  className="text-slate-300 hover:text-yellow-400 transition-colors"
                >
                  kababrayhan@gmail.com
                </a>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Clock size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                <div className="text-slate-300">
                  <p>Daily: 11:00 AM - 11:59 PM</p>
                </div>
              </div>
            </div>
          </div>
         

          {/* Quick Links & Social */}
          <div className="space-y-8">
            {/* Quick Links */}
            <div>
              <h4 className="text-md font-normal text-slate-200 mb-4 tracking-wide">
                Quick Links
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/home"
                  className="text-base text-slate-400 hover:text-yellow-400 transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/my-orders"
                  className="text-base text-slate-400 hover:text-yellow-400 transition-colors"
                >
                  My Orders
                </Link>
                <Link
                  href="/account-profile"
                  className="text-base text-slate-400 hover:text-yellow-400 transition-colors"
                >
                  Profile
                </Link>
                {/* <Link href="#" className="text-base text-slate-400 hover:text-yellow-400 transition-colors">
                  About Us
                </Link>
                <Link href="#" className="text-base text-slate-400 hover:text-yellow-400 transition-colors">
                  Contact
                </Link> */}
                {/* <Link href="#" className="text-base text-slate-400 hover:text-yellow-400 transition-colors">
                  Terms
                </Link> */}
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-md font-normal text-slate-200 mb-4 tracking-wide">
                Follow Us
              </h4>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/Kababalrayhan"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
                  aria-label="Facebook"
                >
                  <FacebookIcon size={20} />
                </a>
                <a
                  href="https://www.instagram.com/kabab_alrayhan/"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
                  aria-label="Instagram"
                >
                  <InstagramIcon size={20} />
                </a>
                <a
                  href="https://www.tiktok.com/@kabab.alrayhan"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
                  aria-label="TikTok"
                >
                  <TiktokIcon size={20} />
                </a>
                <a
                  href="https://wa.me/971503021317?text=Hello!%20I%20have%20a%20question%20about%20your%20services."
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
                  aria-label="WhatsApp"
                >
                  <WhatsappIcon size={20} />
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
