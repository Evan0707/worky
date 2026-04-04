"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("landing");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.06]"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
          <div className="animate-logo-spin">
            <Logo
              className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
              color="white"
            />
          </div>
          <span className="text-[16px] font-semibold font-heading tracking-tight text-white">
            Worky
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-[13px] text-neutral-400 transition-colors hover:text-white"
          >
            {t("nav.features")}
          </a>
          <a
            href="#pricing"
            className="text-[13px] text-neutral-400 transition-colors hover:text-white"
          >
            {t("nav.pricing")}
          </a>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href={`/${locale}/login`}
            className="text-[13px] text-neutral-400 transition-colors hover:text-white"
          >
            {t("nav.login")}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="group/btn inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-black transition-all hover:bg-neutral-200"
          >
            {t("nav.start")}
            <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-2xl border-b border-white/[0.06] animate-fade-in">
          <div className="px-6 py-5 space-y-1">
            <a
              href="#features"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              {t("nav.features")}
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              {t("nav.pricing")}
            </a>
            <div className="pt-3 mt-2 border-t border-white/[0.06] space-y-2">
              <Link
                href={`/${locale}/login`}
                className="block px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:text-white transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link
                href={`/${locale}/login`}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black"
              >
                {t("nav.start")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
