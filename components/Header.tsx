"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/lib/data";

const nav = [
  { href: "/", label: "Главная" },
  { href: "/#podbor", label: "Подбор" },
  { href: "/#cities", label: "Города" },
  { href: "/about", label: "О нас" },
  { href: "/contacts", label: "Контакты" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "border-line shadow-sm" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-1.5" onClick={() => setOpen(false)}>
          <span className="font-display text-2xl font-bold tracking-tight text-brand">
            Elit
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Estate
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative text-sm font-medium transition-colors hover:text-accent ${
                pathname === item.href ? "text-accent" : "text-brand"
              }`}
            >
              {item.label}
              {pathname === item.href && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={CONTACT_PHONE_HREF}
            className="text-sm font-semibold text-brand transition-colors hover:text-accent"
          >
            {CONTACT_PHONE}
          </a>
          <Link
            href="/contacts"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04] hover:bg-brand-light active:scale-[0.97]"
          >
            Оставить заявку
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-brand md:hidden"
          aria-label="Меню"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <motion.line
              x1="4"
              x2="20"
              initial={false}
              animate={open ? { y1: 12, y2: 12, rotate: 45 } : { y1: 7, y2: 7, rotate: 0 }}
              style={{ originX: "12px", originY: "12px" }}
              transition={{ duration: 0.25 }}
            />
            <motion.line
              x1="4"
              x2="20"
              initial={false}
              animate={{ y1: 12, y2: 12, opacity: open ? 0 : 1 }}
              transition={{ duration: 0.15 }}
            />
            <motion.line
              x1="4"
              x2="20"
              initial={false}
              animate={open ? { y1: 12, y2: 12, rotate: -45 } : { y1: 17, y2: 17, rotate: 0 }}
              style={{ originX: "12px", originY: "12px" }}
              transition={{ duration: 0.25 }}
            />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden border-t border-line bg-white md:hidden"
          >
            <div className="px-4 pb-6 pt-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block py-3 text-base font-medium ${
                    pathname === item.href ? "text-accent" : "text-brand"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={CONTACT_PHONE_HREF}
                className="mt-2 block rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white"
              >
                {CONTACT_PHONE}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
