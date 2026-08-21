"use client";

import { useEffect, useMemo, useState } from "react";
import { cities, CONTACT_PHONE, WHATSAPP_HREF, type CitySlug } from "@/lib/data";
import { GOALS, reachGoal } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";

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
  /** Варианты в одну колонку: длинные подписи в две не помещаются. */
  single?: boolean;
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
    { value: "$200 000 – $400 000", label: "$200 000 – $400 000", hint: "студии и 1 спальня" },
    { value: "$400 000 – $700 000", label: "$400 000 – $700 000", hint: "2–3 спальни" },
    { value: "$700 000 – $1 500 000", label: "$700 000 – $1 500 000", hint: "премиальные районы" },
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
    { value: "$200 000 – $500 000", label: "$200 000 – $500 000" },
    { value: "от $500 000", label: "От $500 000" },
    UNDECIDED,
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
      label: "Ещё выбираю страну",
      hint: "поможем сравнить",
      slug: "default",
    },
  ],
};

// Три вопроса до контактов — не семь, как было. Каждый лишний экран
// съедает часть дошедших, а комнаты и способ оплаты менеджер всё равно
// выясняет в первом же разговоре. Срок покупки — единственное, что нужно
// продажам сразу, поэтому он остался, но переехал на шаг с контактами
// и не стоит отдельного экрана.
function buildSteps(citySlug: string, askCity: boolean): Step[] {
  return [
    ...(askCity ? [CITY_STEP] : []),
    {
      key: "goal",
      question: "Что для вас важнее в этой покупке?",
      goal: GOALS.quizGoal,
      single: true,
      options: [
        { value: "Для жизни", label: "Жить самому или переехать с семьёй" },
        { value: "Инвестиции / аренда", label: "Доход от аренды и рост цены" },
        { value: "Переезд / ВНЖ", label: "ВНЖ или второй документ" },
        { value: "Отдых у моря", label: "Дом для отдыха у моря" },
      ],
    },
    {
      key: "budget",
      question: "На какую сумму ориентируетесь?",
      subtitle: "Нужно, чтобы не присылать вам то, что вне бюджета",
      goal: GOALS.quizBudget,
      options: BUDGET_OPTIONS[citySlug] ?? BUDGET_OPTIONS.default,
    },
  ];
}

const TIMING_OPTIONS = [
  "В ближайший месяц",
  "Через 1–3 месяца",
  "Через 3–6 месяцев",
  "Пока изучаю рынок",
];

/** Название страны так, как оно уйдёт в заявку: «Дубай (ОАЭ)». */
function cityAnswer(slug: CitySlug): string {
  const city = cities.find((c) => c.slug === slug);
  if (!city) return "";
  return city.country ? `${city.name} (${city.country})` : city.name;
}

export interface QuizPrefill {
  city?: string;
  budget?: string;
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
  const [citySlug, setCitySlug] = useState<string>(city ?? "default");
  const [answers, setAnswers] = useState<Record<string, string>>(
    city ? { city: cityAnswer(city) } : {}
  );
  const [timing, setTiming] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const steps = useMemo(() => buildSteps(citySlug, !city), [citySlug, city]);
  const total = steps.length + 1; // + шаг с контактами
  const onContactStep = stepIdx === steps.length;

  // «Подобрать в этом бюджете» из калькулятора выше по странице: он не знает
  // о состоянии квиза, поэтому передаёт ответы событием, а не пропсами.
  useEffect(() => {
    function onPrefill(event: Event) {
      const detail = (event as CustomEvent<QuizPrefill>).detail;
      if (!detail) return;
      setAnswers((a) => ({
        ...a,
        ...(detail.city ? { city: detail.city } : {}),
        ...(detail.budget ? { budget: detail.budget } : {}),
      }));
      if (detail.city) {
        const found = cities.find((c) => cityAnswer(c.slug) === detail.city);
        if (found) setCitySlug(found.slug);
      }
      reachGoal(GOALS.quizStart, { source: "budget_explorer" });
      // Страна и бюджет уже известны — остаётся спросить только цель.
      setStepIdx(city ? 0 : 1);
    }
    window.addEventListener("quiz:prefill", onPrefill);
    return () => window.removeEventListener("quiz:prefill", onPrefill);
  }, [city]);

  function pick(key: string, option: Option) {
    if (key === "city") {
      const next = option.slug ?? "default";
      // Сменил страну — прежний бюджет мог исчезнуть из шкалы.
      if (next !== citySlug) {
        setAnswers((a) => {
          const rest: Record<string, string> = { ...a, city: option.value };
          delete rest.budget;
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
    setStepIdx((i) => i + 1);
  }

  function back() {
    setStepIdx((i) => Math.max(0, i - 1));
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
            `Срок покупки: ${data.timing || "—"}`,
            `Куда писать: ${data.channel || "—"}`,
          ].join("; "),
        }),
      });
      if (!res.ok) throw new Error();
      reachGoal(GOALS.quizSubmit, {
        city: answers.city,
        goal: answers.goal,
        budget: answers.budget,
        timing: data.timing,
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="anim-up rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center sm:p-10">
        <p className="text-4xl">✓</p>
        <h3 className="font-display mt-3 text-2xl font-bold text-emerald-900">
          Готово, подборка в работе
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-emerald-800">
          Менеджер соберёт варианты под ваши ответы — с ценами, планировками и
          фото — и свяжется с вами. Обычно это занимает пару часов.
        </p>
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full bg-whatsapp px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          Написать сейчас в WhatsApp
        </a>
      </div>
    );
  }

  const step = steps[stepIdx];

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_18px_50px_-20px_rgb(11_28_46/0.45)]">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 sm:px-7">
        {/* Точки вместо полоски: сразу видно, что шагов всего четыре. */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < stepIdx
                  ? "w-5 bg-accent"
                  : i === stepIdx
                    ? "w-7 bg-accent"
                    : "w-3 bg-line"
              }`}
            />
          ))}
          <span className="ml-2 text-xs font-semibold text-muted">
            {Math.min(stepIdx + 1, total)} / {total}
          </span>
        </div>
        {stepIdx > 0 && status !== "sending" ? (
          <button
            onClick={back}
            className="text-xs font-semibold text-muted transition-colors hover:text-brand"
          >
            ← Назад
          </button>
        ) : (
          <span className="text-xs font-semibold text-muted">≈ 40 секунд</span>
        )}
      </div>

      <div className="p-5 sm:p-7">
        {!onContactStep ? (
          <div key={stepIdx} className="anim-up">
            <h3 className="font-display text-xl font-bold text-brand sm:text-2xl">
              {step.question}
            </h3>
            {step.subtitle && (
              <p className="mt-1.5 text-sm text-muted">{step.subtitle}</p>
            )}
            <div
              className={`mt-5 grid gap-2.5 ${step.single ? "" : "sm:grid-cols-2"}`}
            >
              {step.options.map((o, i, all) => (
                <button
                  key={o.value}
                  onClick={() => pick(step.key, o)}
                  className={`group flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-accent hover:shadow-md ${
                    answers[step.key] === o.value
                      ? "border-accent bg-accent/5"
                      : "border-line bg-white"
                  } ${
                    // Нечётное число вариантов — последний растягиваем на всю
                    // ширину, иначе в сетке остаётся дыра.
                    !step.single && all.length % 2 === 1 && i === all.length - 1
                      ? "sm:col-span-2"
                      : ""
                  }`}
                >
                  <span>
                    <span className="block text-[0.95rem] font-semibold leading-snug text-brand">
                      {o.label}
                    </span>
                    {o.hint && (
                      <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>
                    )}
                  </span>
                  <span className="text-lg leading-none text-line transition-colors group-hover:text-accent">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="anim-up">
            {/* Показываем, что человек уже прошёл: бросить на последнем шаге
                психологически труднее, когда видно проделанный путь. */}
            <div className="flex flex-wrap gap-1.5">
              {[answers.city, answers.goal, answers.budget]
                .filter(Boolean)
                .map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-dark"
                  >
                    ✓ {v}
                  </span>
                ))}
            </div>

            <h3 className="font-display mt-3 text-xl font-bold text-brand sm:text-2xl">
              Куда прислать подборку?
            </h3>
            <p className="mt-1.5 text-sm text-muted">
              Пришлём варианты с ценами и планировками. Без звонков-роботов и
              рассылок — общается живой менеджер.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-2.5">
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
                autoComplete="name"
                placeholder="Как вас зовут"
                className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
              <input
                name="phone"
                required
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="Телефон или ник в Telegram"
                className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
              />

              {/* Главный страх последнего шага — «сейчас начнут названивать».
                  Поэтому спрашиваем удобный канал прямо здесь. */}
              <fieldset>
                <legend className="mb-1.5 text-xs font-semibold text-muted">
                  Как удобнее получить подборку?
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {["WhatsApp", "Telegram", "Звонок"].map((c, i) => (
                    <label key={c} className="cursor-pointer">
                      <input
                        type="radio"
                        name="channel"
                        value={c}
                        defaultChecked={i === 0}
                        className="peer sr-only"
                      />
                      <span className="block rounded-xl border-2 border-line px-2 py-2.5 text-center text-xs font-semibold text-brand transition-colors peer-checked:border-accent peer-checked:bg-accent/5">
                        {c}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <select
                name="timing"
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-sm text-brand outline-none transition-colors focus:border-accent"
              >
                <option value="">Когда планируете покупку? (необязательно)</option>
                {TIMING_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-xl bg-accent px-6 py-4 text-base font-bold text-white transition-all duration-150 hover:scale-[1.01] hover:bg-accent-dark active:scale-[0.99] disabled:opacity-60"
              >
                {status === "sending" ? "Отправляем…" : "Получить подборку бесплатно"}
              </button>

              {status === "error" && (
                <p className="text-center text-sm text-red-600">
                  Не удалось отправить. Позвоните нам: {CONTACT_PHONE}
                </p>
              )}

              {/* Часть людей не оставит номер ни при каких условиях —
                  пусть у них будет выход, где первый шаг делают они сами. */}
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border-2 border-whatsapp/40 py-3 text-center text-sm font-semibold text-[#128c4b] transition-colors hover:bg-whatsapp/10"
              >
                Не хочу оставлять номер — напишу сам в WhatsApp
              </a>

              <p className="text-center text-[0.7rem] leading-relaxed text-muted">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
