"use client";

import Image, { type StaticImageData } from "next/image";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import plan501 from "@/public/floorplans/plan-50-1.png";
import plan502 from "@/public/floorplans/plan-50-2.png";
import plan601 from "@/public/floorplans/plan-60-1.png";
import plan602 from "@/public/floorplans/plan-60-2.png";
import plan701 from "@/public/floorplans/plan-70-1.png";
import plan702 from "@/public/floorplans/plan-70-2.png";

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

interface Plan {
  src: StaticImageData;
  area: string;
  title: string;
  note: string;
}

const plans: Plan[] = [
  {
    src: plan501,
    area: "50 м²",
    title: "1 спальня",
    note: "Для пары или под аренду: изолированная спальня и просторная гостиная-кухня.",
  },
  {
    src: plan502,
    area: "50 м²",
    title: "Студия с гардеробной",
    note: "Максимум открытого пространства — популярный формат под посуточную аренду.",
  },
  {
    src: plan601,
    area: "60 м²",
    title: "2 спальни",
    note: "Компактная семейная планировка: детская и родительская спальни.",
  },
  {
    src: plan602,
    area: "60 м²",
    title: "Спальня и кабинет",
    note: "Для тех, кто работает из дома: отдельный кабинет вместо второй спальни.",
  },
  {
    src: plan701,
    area: "70 м²",
    title: "2 спальни, 2 санузла",
    note: "Второй санузел при спальне — заметно удобнее для семьи и гостей.",
  },
  {
    src: plan702,
    area: "70 м²",
    title: "3 спальни",
    note: "Максимум комнат при той же площади: две детские и родительская.",
  },
];

const slide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -60 : 60 }),
};

export default function FloorPlans() {
  const [[index, direction], setState] = useState<[number, number]>([0, 0]);

  const paginate = useCallback((dir: number) => {
    setState(([i]) => [(i + dir + plans.length) % plans.length, dir]);
  }, []);

  const goTo = useCallback((next: number) => {
    setState(([i]) => [next, next > i ? 1 : -1]);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") paginate(-1);
      if (e.key === "ArrowRight") paginate(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paginate]);

  const plan = plans[index];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-card shadow-lg">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={index}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: EASE }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            onDragEnd={(_, info) => {
              // Свайп засчитываем и по расстоянию, и по скорости — короткий
              // резкий флик на телефоне не должен теряться.
              if (info.offset.x < -60 || info.velocity.x < -400) paginate(1);
              else if (info.offset.x > 60 || info.velocity.x > 400) paginate(-1);
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <Image
              src={plan.src}
              alt={`Планировка квартиры ${plan.area} — ${plan.title}`}
              sizes="(max-width: 768px) 100vw, 720px"
              placeholder="blur"
              draggable={false}
              className="w-full select-none"
            />
          </motion.div>
        </AnimatePresence>

        {/* На узких экранах чертёж и так занимает всю ширину — стрелки поверх
            него перекрывали бы комнаты, поэтому там листаем свайпом и кнопками
            под каруселью. */}
        <button
          type="button"
          onClick={() => paginate(-1)}
          aria-label="Предыдущая планировка"
          className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-brand shadow-md backdrop-blur transition-all hover:scale-105 hover:border-accent hover:text-accent active:scale-95 sm:flex"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => paginate(1)}
          aria-label="Следующая планировка"
          className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-brand shadow-md backdrop-blur transition-all hover:scale-105 hover:border-accent hover:text-accent active:scale-95 sm:flex"
        >
          →
        </button>
      </div>

      {/* Подпись под слайдом */}
      <div className="mt-6 min-h-[76px] text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <p className="font-display text-2xl font-bold text-brand">
              {plan.area} <span className="text-accent">· {plan.title}</span>
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {plan.note}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Точки, а на мобильных — ещё и кнопки перелистывания */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => paginate(-1)}
          aria-label="Предыдущая планировка"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-brand shadow-sm transition-colors hover:border-accent hover:text-accent active:scale-95 sm:hidden"
        >
          ←
        </button>

        <div className="flex items-center gap-2.5">
          {plans.map((p, i) => (
            <button
              key={p.area + p.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Планировка ${i + 1} из ${plans.length}: ${p.area}, ${p.title}`}
              aria-current={i === index}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-accent" : "w-2.5 bg-line hover:bg-accent/40"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => paginate(1)}
          aria-label="Следующая планировка"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-brand shadow-sm transition-colors hover:border-accent hover:text-accent active:scale-95 sm:hidden"
        >
          →
        </button>
      </div>
    </div>
  );
}
