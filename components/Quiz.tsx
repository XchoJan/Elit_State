"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useMemo, useState } from "react";
import { cities, CONTACT_PHONE, type CitySlug } from "@/lib/data";
import { GOALS, reachGoal } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

interface Option {
  value: string;
  label: string;
  hint?: string;
  /** Только у вариантов первого шага — по нему подбираются шкалы дальше. */
  slug?: string;
}

interface Step {
  key: string;
  question: string;
  subtitle?: string;
  options: Option[];
  /** Цель Метрики — чтобы видеть, на каком шаге отваливаются. */
  goal: string;
}

const UNDECIDED: Option = {
  value: "Пока не определился",
  label: "Пока не определился",
  hint: "подскажем ориентиры",
};

// Порог входа сильно разный по странам: в Дубае почти нет предложений
// дешевле $300 000, а в России считать удобнее в рублях. Поэтому шкала
// бюджета своя для каждого направления.
const BUDGET_OPTIONS: Record<string, Option[]> = {
  dubai: [
    { value: "$300 000 – $500 000", label: "$300 000 – $500 000", hint: "студии и 1 спальня" },
    { value: "$500 000 – $800 000", label: "$500 000 – $800 000", hint: "2–3 спальни" },
    { value: "$800 000 – $1 500 000", label: "$800 000 – $1 500 000", hint: "премиальные районы" },
    { value: "от $1 500 000", label: "От $1 500 000", hint: "виллы и пентхаусы" },
    UNDECIDED,
  ],
  yerevan: [
    { value: "до $100 000", label: "До $100 000", hint: "студии и 1–2 комнаты" },
    { value: "$100 000 – $200 000", label: "$100 000 – $200 000", hint: "новостройки в центре" },
    { value: "$200 000 – $300 000", label: "$200 000 – $300 000", hint: "просторные квартиры" },
    { value: "от $300 000", label: "От $300 000", hint: "дома и пентхаусы" },
    UNDECIDED,
  ],
  tbilisi: [
    { value: "до $100 000", label: "До $100 000", hint: "новостройки Тбилиси и Батуми" },
    { value: "$100 000 – $200 000", label: "$100 000 – $200 000", hint: "видовые квартиры" },
    { value: "$200 000 – $300 000", label: "$200 000 – $300 000", hint: "премиум-комплексы" },
    { value: "от $300 000", label: "От $300 000", hint: "дома и пентхаусы" },
    UNDECIDED,
  ],
  krasnodar: [
    { value: "до 5 млн ₽", label: "До 5 млн ₽", hint: "студии и 1-комнатные" },
    { value: "5–10 млн ₽", label: "5–10 млн ₽", hint: "комфорт-класс" },
    { value: "10–20 млн ₽", label: "10–20 млн ₽", hint: "бизнес-класс" },
    { value: "от 20 млн ₽", label: "От 20 млн ₽", hint: "премиум и дома" },
    UNDECIDED,
  ],
  default: [
    { value: "до $100 000", label: "До $100 000" },
    { value: "$100 000 – $200 000", label: "$100 000 – $200 000" },
    { value: "$200 000 – $300 000", label: "$200 000 – $300 000" },
    { value: "от $300 000", label: "От $300 000" },
    UNDECIDED,
  ],
};

// Доступные схемы оплаты тоже завязаны на страну: беспроцентная рассрочка —
// фишка Дубая, семейная ипотека — России.
const PAYMENT_OPTIONS: Record<string, Option[]> = {
  dubai: [
    { value: "Полная оплата", label: "💵 Полная оплата" },
    {
      value: "Рассрочка от застройщика",
      label: "📄 Рассрочка от застройщика",
      hint: "часто без процентов",
    },
    { value: "Ипотека в банке ОАЭ", label: "🏦 Ипотека в банке ОАЭ" },
    { value: "Ещё не решил", label: "🤔 Ещё не решил", hint: "разберём варианты" },
  ],
  krasnodar: [
    { value: "Полная оплата", label: "💵 Полная оплата" },
    { value: "Ипотека", label: "🏦 Ипотека", hint: "в том числе семейная" },
    { value: "Рассрочка от застройщика", label: "📄 Рассрочка от застройщика" },
    { value: "Ещё не решил", label: "🤔 Ещё не решил", hint: "разберём варианты" },
  ],
  default: [
    { value: "Полная оплата", label: "💵 Полная оплата" },
    { value: "Рассрочка от застройщика", label: "📄 Рассрочка от застройщика" },
    { value: "Ипотека / кредит", label: "🏦 Ипотека или кредит" },
    { value: "Ещё не решил", label: "🤔 Ещё не решил", hint: "разберём варианты" },
  ],
};

const CITY_STEP: Step = {
  key: "city",
  question: "Где ищете недвижимость?",
  goal: GOALS.quizStart,
  options: [
    ...cities.map((c) => ({
      value: c.country ? `${c.name} (${c.country})` : c.name,
      label: `${c.countryFlag} ${c.name}`,
      hint: c.country,
      slug: c.slug,
    })),
    {
      value: "Не определился",
      label: "🤔 Ещё выбираю",
      hint: "поможем сравнить",
      slug: "default",
    },
  ],
};

// На посадочной странице конкретной страны город уже известен из URL —
// первый шаг пропускаем: чем меньше кликов до контактов, тем выше конверсия.
function buildSteps(citySlug: string, askCity: boolean): Step[] {
  return [
    ...(askCity ? [CITY_STEP] : []),
    {
      key: "goal",
      question: "Для чего покупаете?",
      goal: GOALS.quizGoal,
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
      subtitle: "Ориентир по этому направлению — точные цены зависят от объекта",
      goal: GOALS.quizBudget,
      options: BUDGET_OPTIONS[citySlug] ?? BUDGET_OPTIONS.default,
    },
    {
      key: "rooms",
      question: "Сколько комнат нужно?",
      goal: GOALS.quizRooms,
      options: [
        { value: "Студия", label: "Студия" },
        { value: "1–2 комнаты", label: "1–2 комнаты" },
        { value: "3 и больше", label: "3 и больше" },
        { value: "Дом / вилла", label: "Дом или вилла" },
      ],
    },
    {
      key: "payment",
      question: "Как планируете оплачивать?",
      subtitle: "Подберём объекты под подходящие условия",
      goal: GOALS.quizPayment,
      options: PAYMENT_OPTIONS[citySlug] ?? PAYMENT_OPTIONS.default,
    },
    {
      key: "timing",
      question: "Когда планируете покупку?",
      goal: GOALS.quizTiming,
      options: [
        {
          value: "В ближайший месяц",
          label: "🔥 В ближайший месяц",
          hint: "готов смотреть объекты",
        },
        { value: "1–3 месяца", label: "📅 Через 1–3 месяца" },
        { value: "3–6 месяцев", label: "🗓️ Через 3–6 месяцев" },
        { value: "Изучаю рынок", label: "🔍 Пока изучаю рынок", hint: "без конкретных сроков" },
      ],
    },
  ];
}

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

/** Название страны так, как оно уйдёт в заявку: «Дубай (ОАЭ)». */
function cityAnswer(slug: CitySlug): string {
  const city = cities.find((c) => c.slug === slug);
  if (!city) return "";
  return city.country ? `${city.name} (${city.country})` : city.name;
}

export default function Quiz({
  city,
  subject = "Квиз-подбор недвижимости",
}: {
  /** Задан на посадочной странице страны — тогда шаг выбора города не показываем. */
  city?: CitySlug;
  subject?: string;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [citySlug, setCitySlug] = useState<string>(city ?? "default");
  const [answers, setAnswers] = useState<Record<string, string>>(
    city ? { city: cityAnswer(city) } : {}
  );
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const steps = useMemo(() => buildSteps(citySlug, !city), [citySlug, city]);
  const total = steps.length + 1; // + шаг с контактами
  const onContactStep = stepIdx === steps.length;

  function pick(key: string, option: Option) {
    if (key === "city") {
      const next = option.slug ?? "default";
      // Сменил страну — прежние бюджет и способ оплаты могли исчезнуть из шкалы.
      if (next !== citySlug) {
        setAnswers((a) => {
          const rest: Record<string, string> = { ...a, city: option.value };
          delete rest.budget;
          delete rest.payment;
          return rest;
        });
        setCitySlug(next);
      } else {
        setAnswers((a) => ({ ...a, city: option.value }));
      }
    } else {
      setAnswers((a) => ({ ...a, [key]: option.value }));
    }

    reachGoal(steps[stepIdx].goal, { [key]: option.value });
    // Дошёл до формы контактов — самый важный шаг перед заявкой.
    if (stepIdx + 1 === steps.length) reachGoal(GOALS.quizContacts);
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
          company: data.company,
          subject,
          ...getAttribution(),
          message: [
            `Город: ${answers.city ?? "—"}`,
            `Цель: ${answers.goal ?? "—"}`,
            `Бюджет: ${answers.budget ?? "—"}`,
            `Комнаты: ${answers.rooms ?? "—"}`,
            `Оплата: ${answers.payment ?? "—"}`,
            `Срок покупки: ${answers.timing ?? "—"}`,
          ].join("; "),
        }),
      });
      if (!res.ok) throw new Error();
      reachGoal(GOALS.quizSubmit, {
        city: answers.city,
        goal: answers.goal,
        budget: answers.budget,
        rooms: answers.rooms,
        payment: answers.payment,
        timing: answers.timing,
      });
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
                {steps[stepIdx].subtitle && (
                  <p className="mt-2 text-sm text-muted">{steps[stepIdx].subtitle}</p>
                )}
                <motion.div
                  className="mt-6 grid gap-3 sm:grid-cols-2"
                  variants={optionsParent}
                  initial="hidden"
                  animate="show"
                >
                  {steps[stepIdx].options.map((o, i, all) => (
                    <motion.button
                      key={o.value}
                      variants={optionItem}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pick(steps[stepIdx].key, o)}
                      className={`rounded-2xl border-2 px-5 py-4 text-left transition-colors hover:border-accent hover:shadow-md ${
                        answers[steps[stepIdx].key] === o.value
                          ? "border-accent bg-accent/5"
                          : "border-line bg-white"
                      } ${
                        // Нечётное число вариантов — последний растягиваем на всю ширину,
                        // иначе в сетке остаётся дыра.
                        all.length % 2 === 1 && i === all.length - 1 ? "sm:col-span-2" : ""
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
                  обычно в течение 15 минут, круглосуточно.
                </p>
                <form onSubmit={submit} className="mt-6 space-y-3">
                  {/* Ловушка для спам-ботов: человек это поле не видит. */}
                  <input
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  />
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
