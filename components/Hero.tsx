"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { cities, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/lib/data";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80";

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Недвижимость мечты"
          fill
          preload
          sizes="100vw"
          className="animate-kenburns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand/80 via-brand/60 to-brand/85" />
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-float-a" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-float-b" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-24 pt-20 text-center sm:px-6 sm:pb-28 sm:pt-28"
      >
        <motion.p
          variants={item}
          className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm"
        >
          Дубай · Ереван · Грузия · Россия
        </motion.p>
        <motion.h1
          variants={item}
          className="font-display mt-6 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
        >
          Найдём квартиру вашей мечты
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg"
        >
          Не тратьте недели на поиск. Ответьте на 4 вопроса — и за 24 часа мы
          пришлём персональную подборку квартир и домов от проверенных
          застройщиков, под ваш бюджет и вкус.
        </motion.p>
        <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#podbor"
            className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.04] hover:bg-accent-dark active:scale-[0.97]"
          >
            Подобрать за 1 минуту
          </a>
          <a
            href={CONTACT_PHONE_HREF}
            className="rounded-full border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-[1.04] hover:bg-white/20 active:scale-[0.97]"
          >
            {CONTACT_PHONE}
          </a>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-14 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={c.path}
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white backdrop-blur-md transition-all duration-200 hover:scale-[1.04] hover:border-accent hover:bg-white/20"
            >
              <span className="text-2xl">{c.countryFlag}</span>
              <p className="mt-1.5 text-sm font-semibold">{c.name}</p>
              {c.country && <p className="text-xs text-white/70">{c.country}</p>}
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
