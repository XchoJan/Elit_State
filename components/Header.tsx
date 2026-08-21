"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/lib/data";

const nav = [
  { href: "/", label: "Главная" },
  { href: "/#podbor", label: "Подбор" },
  { href: "/#cities", label: "Направления" },
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
            Elite
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
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-accent" />
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
          {/* Ведём на квиз, а не на страницу контактов: там человек упирается
              в пустую форму, здесь — в первый лёгкий вопрос. */}
          <Link
            href="/#podbor"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04] hover:bg-accent-dark active:scale-[0.97]"
          >
            Подобрать бесплатно
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
          aria-label="Меню"
          aria-expanded={open}
        >
          <span className="relative block h-4 w-6">
            <span
              className={`absolute left-0 block h-0.5 w-6 rounded-full bg-brand transition-transform duration-300 ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-0.5 w-6 -translate-y-1/2 rounded-full bg-brand transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-6 rounded-full bg-brand transition-transform duration-300 ${
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Раскрытие меню: сетка с 0fr → 1fr анимирует высоту без её измерения
          в JS и без библиотеки анимаций. */}
      <div
        className={`grid overflow-hidden border-t bg-white transition-all duration-300 md:hidden ${
          open ? "grid-rows-[1fr] border-line" : "grid-rows-[0fr] border-transparent"
        }`}
      >
        <div className="min-h-0">
          <div className="px-4 pb-5 pt-2">
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
        </div>
      </div>
    </header>
  );
}
