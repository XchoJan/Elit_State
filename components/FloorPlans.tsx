"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Картинки заранее сжаты в webp и лежат в public: у процессора на сервере
// нет микроархитектуры x86-64-v2, поэтому sharp там не запускается и
// оптимизатор Next отдавал бы исходные png в полный вес.
interface Plan {
  /** Имя файла без размера и расширения: plan-50-1 → plan-50-1-720.webp */
  file: string;
  area: string;
  title: string;
  note: string;
}

const plans: Plan[] = [
  {
    file: "plan-50-1",
    area: "50 м²",
    title: "1 спальня",
    note: "Для пары или под аренду: изолированная спальня и просторная гостиная-кухня.",
  },
  {
    file: "plan-50-2",
    area: "50 м²",
    title: "Студия с гардеробной",
    note: "Максимум открытого пространства — популярный формат под посуточную аренду.",
  },
  {
    file: "plan-60-1",
    area: "60 м²",
    title: "2 спальни",
    note: "Компактная семейная планировка: детская и родительская спальни.",
  },
  {
    file: "plan-60-2",
    area: "60 м²",
    title: "Спальня и кабинет",
    note: "Для тех, кто работает из дома: отдельный кабинет вместо второй спальни.",
  },
  {
    file: "plan-70-1",
    area: "70 м²",
    title: "2 спальни, 2 санузла",
    note: "Второй санузел при спальне — заметно удобнее для семьи и гостей.",
  },
  {
    file: "plan-70-2",
    area: "70 м²",
    title: "3 спальни",
    note: "Максимум комнат при той же площади: две детские и родительская.",
  },
];

export default function FloorPlans() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Листание — это обычная горизонтальная прокрутка со scroll-snap: свайп
  // на телефоне и инерцию браузер делает сам, без библиотеки перетаскивания.
  const goTo = useCallback((next: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
  }, []);

  const paginate = useCallback(
    (dir: number) => goTo((index + dir + plans.length) % plans.length),
    [goTo, index]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") paginate(-1);
      if (e.key === "ArrowRight") paginate(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paginate]);

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  const plan = plans[index];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-card shadow-lg">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {plans.map((p, i) => (
            <div key={p.area + p.title} className="w-full shrink-0 snap-center">
              <img
                src={`/floorplans/${p.file}-720.webp`}
                srcSet={`/floorplans/${p.file}-720.webp 720w, /floorplans/${p.file}-1080.webp 1080w`}
                sizes="(max-width: 768px) 100vw, 720px"
                alt={`Планировка квартиры ${p.area} — ${p.title}`}
                width={1080}
                height={1080}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="h-auto w-full select-none"
              />
            </div>
          ))}
        </div>

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
        <p className="font-display text-2xl font-bold text-brand">
          {plan.area} <span className="text-accent">· {plan.title}</span>
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {plan.note}
        </p>
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
