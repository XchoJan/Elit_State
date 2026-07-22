"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useState } from "react";
import { cities, CONTACT_PHONE } from "@/lib/data";

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

interface Step {
  key: string;
  question: string;
  options: { value: string; label: string; hint?: string }[];
}

const steps: Step[] = [
  {
    key: "city",
    question: "Где ищете недвижимость?",
    options: [
      ...cities.map((c) => ({
        value: `${c.name} (${c.country})`,
        label: `${c.countryFlag} ${c.name}`,
        hint: c.country,
      })),
      { value: "Не определился", label: "🤔 Ещё выбираю", hint: "поможем сравнить" },
    ],
  },
  {
    key: "goal",
    question: "Для чего покупаете?",
    options: [
      { value: "Для жизни", label: "🏠 Для себя и семьи" },
      { value: "Инвестиции / аренда", label: "📈 Инвестиции и аренда" },
      { value: "Переезд / ВНЖ", label: "✈️ Переезд или ВНЖ" },
      { value: "Отдых у моря", label: "🌊 Дом для отдыха" },
    ],
  },
  {
    key: "budget",
    question: "Какой бюджет рассматриваете?",
    options: [
      { value: "до $100 000", label: "До $100 000" },
      { value: "$100 000 – $300 000", label: "$100 000 – $300 000" },
      { value: "$300 000 – $700 000", label: "$300 000 – $700 000" },
      { value: "от $700 000", label: "От $700 000" },
    ],
  },
  {
    key: "rooms",
    question: "Сколько комнат нужно?",
    options: [
      { value: "Студия", label: "Студия" },
      { value: "1–2 комнаты", label: "1–2 комнаты" },
      { value: "3 и больше", label: "3 и больше" },
      { value: "Дом / вилла", label: "Дом или вилла" },
    ],
  },
];

const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -32 : 32 }),
};

const optionsParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const optionItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

export default function Quiz() {
  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const total = steps.length + 1; // + шаг с контактами
  const onContactStep = stepIdx === steps.length;

  function pick(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
    setDirection(1);
    setStepIdx((i) => i + 1);
  }

  function back() {
    setDirection(-1);
    setStepIdx((i) => i - 1);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          subject: "Квиз-подбор недвижимости",
          message: [
            `Город: ${answers.city ?? "—"}`,
            `Цель: ${answers.goal ?? "—"}`,
            `Бюджет: ${answers.budget ?? "—"}`,
            `Комнаты: ${answers.rooms ?? "—"}`,
          ].join("; "),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center"
      >
        <motion.p
          className="text-5xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 15 }}
        >
          🎉
        </motion.p>
        <h3 className="mt-4 text-2xl font-bold text-emerald-900">
          Спасибо! Подборка уже готовится
        </h3>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-emerald-800">
          Менеджер свяжется с вами в ближайшее время и пришлёт варианты под ваши
          ответы — с ценами, планировками и фото.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-lg">
      {/* Прогресс */}
      <div className="flex h-1.5 w-full bg-line">
        <motion.div
          className="bg-accent"
          animate={{ width: `${((stepIdx + 1) / total) * 100}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </div>

      <div className="p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Шаг {Math.min(stepIdx + 1, total)} из {total}
          </p>
          {stepIdx > 0 && status !== "sending" && (
            <button
              onClick={back}
              className="text-sm font-medium text-muted transition-colors hover:text-brand"
            >
              ← Назад
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={stepIdx}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: EASE }}
          >
            {!onContactStep ? (
              <>
                <h3 className="font-display mt-4 text-2xl font-bold text-brand sm:text-3xl">
                  {steps[stepIdx].question}
                </h3>
                <motion.div
                  className="mt-6 grid gap-3 sm:grid-cols-2"
                  variants={optionsParent}
                  initial="hidden"
                  animate="show"
                >
                  {steps[stepIdx].options.map((o) => (
                    <motion.button
                      key={o.value}
                      variants={optionItem}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pick(steps[stepIdx].key, o.value)}
                      className={`rounded-2xl border-2 px-5 py-4 text-left transition-colors hover:border-accent hover:shadow-md ${
                        answers[steps[stepIdx].key] === o.value
                          ? "border-accent bg-accent/5"
                          : "border-line bg-white"
                      }`}
                    >
                      <span className="block text-base font-semibold text-brand">
                        {o.label}
                      </span>
                      {o.hint && (
                        <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            ) : (
              <>
                <h3 className="font-display mt-4 text-2xl font-bold text-brand sm:text-3xl">
                  Куда прислать подборку?
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Менеджер подготовит варианты под ваши ответы и свяжется с вами —
                  обычно в течение 15 минут в рабочее время.
                </p>
                <form onSubmit={submit} className="mt-6 space-y-3">
                  <input
                    name="name"
                    required
                    placeholder="Ваше имя"
                    className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
                  />
                  <input
                    name="phone"
                    required
                    type="tel"
                    placeholder="Телефон или WhatsApp"
                    className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
                  />
                  <motion.button
                    type="submit"
                    disabled={status === "sending"}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
                  >
                    {status === "sending" ? "Отправляем…" : "Получить подборку бесплатно"}
                  </motion.button>
                  {status === "error" && (
                    <p className="text-center text-sm text-red-600">
                      Не удалось отправить. Позвоните нам: {CONTACT_PHONE}
                    </p>
                  )}
                  <p className="text-center text-xs text-muted">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
