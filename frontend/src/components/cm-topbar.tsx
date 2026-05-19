"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export function CmTopbar() {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: t("nav.content.tests"), href: "/admin/tests" },
    { label: "Surveys", href: "/admin/surveys" },
    { label: "Dashboards", href: "/admin/dashboards" },
  ];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04] transition-all duration-300">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Logo + Admin badge */}
        <div className="mr-2 md:mr-3 text-[1.1rem] font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          ProfWise
        </div>
        <span className="mr-6 md:mr-10 text-[0.6rem] font-bold uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded">
          {t("topbar.content.badge")}
        </span>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={
                  "relative rounded-lg px-3.5 py-1.5 text-[0.82rem] font-medium transition-all duration-200 " +
                  (active
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600")
                }
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gray-900" />
                )}
              </a>
            );
          })}
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          {/* Language switch */}
          <div className="flex items-center gap-0.5 rounded-full bg-gray-50 p-0.5">
            <button
              onClick={() => setLocale("kz")}
              className={
                "rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-all duration-200 " +
                (locale === "kz"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600")
              }
            >
              KZ
            </button>
            <button
              onClick={() => setLocale("ru")}
              className={
                "rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-all duration-200 " +
                (locale === "ru"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600")
              }
            >
              RU
            </button>
            <button
              onClick={() => setLocale("en")}
              className={
                "rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-all duration-200 " +
                (locale === "en"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600")
              }
            >
              EN
            </button>
          </div>

          <div className="h-5 w-px bg-gray-100 mx-1" />

          {/* User dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm transition-all duration-200 hover:bg-gray-50"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-[0.7rem] font-semibold text-white shadow-sm">
                A
              </div>
              <span className="text-[0.82rem] font-medium text-gray-700">
                Admin
              </span>
              <ChevronDown
                className={
                  "h-3 w-3 text-gray-400 transition-transform duration-200 " +
                  (userMenuOpen ? "rotate-180" : "")
                }
              />
            </button>
            {userMenuOpen && (
              <div className="animate-slide-down absolute right-0 top-full mt-2 min-w-[180px] rounded-xl border border-black/[0.04] bg-white/90 backdrop-blur-xl py-1.5 shadow-xl shadow-black/[0.08]">
                <a
                  href="/profile"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <User className="h-3.5 w-3.5" />
                  {t("topbar.profile")}
                </a>
                <div className="mx-3 my-1 h-px bg-gray-100" />
                <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[0.82rem] text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
                  <LogOut className="h-3.5 w-3.5" />
                  {t("topbar.logout")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: avatar + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-[0.7rem] font-semibold text-white shadow-sm">
            C
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="animate-slide-down md:hidden border-t border-black/[0.04] bg-white/95 backdrop-blur-xl">
          <div className="flex flex-col px-4 py-3 gap-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={
                    "rounded-lg px-3 py-2.5 text-[0.88rem] font-medium transition-colors " +
                    (active
                      ? "bg-gray-50 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900")
                  }
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="border-t border-black/[0.04] px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.78rem] font-medium text-gray-400">
                {t("topbar.language")}
              </span>
              <div className="flex items-center gap-0.5 rounded-full bg-gray-50 p-0.5">
                <button
                  onClick={() => setLocale("kz")}
                  className={
                    "rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-all duration-200 " +
                    (locale === "kz"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600")
                  }
                >
                  KZ
                </button>
                <button
                  onClick={() => setLocale("ru")}
                  className={
                    "rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-all duration-200 " +
                    (locale === "ru"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600")
                  }
                >
                  RU
                </button>
                <button
                  onClick={() => setLocale("en")}
                  className={
                    "rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-all duration-200 " +
                    (locale === "en"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600")
                  }
                >
                  EN
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <a
                href="/profile"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.85rem] text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                <User className="h-4 w-4" />
                {t("topbar.profile")}
              </a>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[0.85rem] text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
                <LogOut className="h-4 w-4" />
                {t("topbar.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
