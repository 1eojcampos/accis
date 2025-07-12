"use client";

import { cn } from "@/lib/utils";
import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export function CenteredWithLogo() {
  const mainNavigation = [
    {
      title: "Browse Printers",
      href: "/browse",
    },
    {
      title: "How It Works",
      href: "/how-it-works",
    },
    {
      title: "Pricing",
      href: "/pricing",
    },
    {
      title: "Become a Provider",
      href: "/providers/signup",
    },
    {
      title: "Support",
      href: "/support",
    },
    {
      title: "Blog",
      href: "/blog",
    },
  ];

  const forProviders = [
    {
      title: "Provider Dashboard",
      href: "/providers/dashboard",
    },
    {
      title: "List Your Printer",
      href: "/providers/add-printer",
    },
    {
      title: "Earnings",
      href: "/providers/earnings",
    },
    {
      title: "Provider Support",
      href: "/providers/support",
    },
  ];

  const forCustomers = [
    {
      title: "My Orders",
      href: "/orders",
    },
    {
      title: "Design Upload",
      href: "/upload",
    },
    {
      title: "Material Guide",
      href: "/materials",
    },
    {
      title: "Get Quote",
      href: "/quote",
    },
  ];

  return (
    <div className="border-t border-neutral-700 px-8 py-20 bg-neutral-900 w-full relative overflow-hidden">
      <div className="max-w-7xl mx-auto text-sm text-neutral-400 md:px-8">
        <div className="flex flex-col items-center justify-center w-full relative">
          <div className="mr-0 md:mr-4 md:flex mb-8">
            <Logo />
          </div>

          {/* Main Navigation */}
          <ul className="transition-colors flex sm:flex-row flex-col hover:text-neutral-200 text-neutral-300 list-none gap-6 mb-8">
            {mainNavigation.map((page, idx) => (
              <li key={"main-nav" + idx} className="list-none">
                <Link
                  className="transition-colors hover:text-emerald-400 font-[var(--font-body)]"
                  href={page.href}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>

          {/* Provider and Customer Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl mb-8">
            <div className="text-center">
              <h3 className="font-semibold text-neutral-200 mb-4 font-[var(--font-display)]">
                For Providers
              </h3>
              <ul className="space-y-2">
                {forProviders.map((link, idx) => (
                  <li key={"provider" + idx}>
                    <Link
                      href={link.href}
                      className="text-neutral-400 hover:text-emerald-400 transition-colors font-[var(--font-body)]"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-neutral-200 mb-4 font-[var(--font-display)]">
                For Customers
              </h3>
              <ul className="space-y-2">
                {forCustomers.map((link, idx) => (
                  <li key={"customer" + idx}>
                    <Link
                      href={link.href}
                      className="text-neutral-400 hover:text-emerald-400 transition-colors font-[var(--font-body)]"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Information */}
          <div className="flex flex-col sm:flex-row gap-6 text-center mb-8">
            <div className="flex items-center gap-2 justify-center">
              <Mail className="h-4 w-4 text-emerald-400" />
              <Link
                href="mailto:support@accis.com"
                className="text-neutral-400 hover:text-emerald-400 transition-colors font-[var(--font-body)]"
              >
                support@accis.com
              </Link>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Phone className="h-4 w-4 text-emerald-400" />
              <Link
                href="tel:+1-555-0123"
                className="text-neutral-400 hover:text-emerald-400 transition-colors font-[var(--font-body)]"
              >
                +1 (555) 012-3456
              </Link>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="text-neutral-400 font-[var(--font-body)]">San Francisco, CA</span>
            </div>
          </div>

          <GridLineHorizontal className="max-w-7xl mx-auto" />
        </div>
        <div className="flex sm:flex-row flex-col justify-between mt-8 items-center w-full">
          <p className="text-neutral-500 mb-8 sm:mb-0 font-[var(--font-body)]">
            &copy; 2024 Accis. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-emerald-400 transition-colors">
              <Twitter className="h-6 w-6 text-neutral-400" />
            </Link>
            <Link href="#" className="hover:text-emerald-400 transition-colors">
              <Linkedin className="h-6 w-6 text-neutral-400" />
            </Link>
            <Link href="#" className="hover:text-emerald-400 transition-colors">
              <Github className="h-6 w-6 text-neutral-400" />
            </Link>
            <Link href="#" className="hover:text-emerald-400 transition-colors">
              <Facebook className="h-6 w-6 text-neutral-400" />
            </Link>
            <Link href="#" className="hover:text-emerald-400 transition-colors">
              <Instagram className="h-6 w-6 text-neutral-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const GridLineHorizontal = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px", //-100px if you want to keep the line inside
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "w-[calc(100%+var(--offset))] h-[var(--height)]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className
      )}
    ></div>
  );
};

const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm mr-4 text-white px-2 py-1 relative z-20"
    >
      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg font-[var(--font-display)]">P</span>
      </div>
      <span className="font-semibold text-white text-xl font-[var(--font-display)]">Accis</span>
    </Link>
  );
};