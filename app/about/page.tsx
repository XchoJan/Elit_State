import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AnimatedNumber from "@/components/AnimatedNumber";
import { Reveal, RevealItem, RevealStagger } from "@/components/Reveal";
import { cities, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/lib/data";

export const metadata: Metadata = {
  title: "О нас",
  description:
    "Elit Estate — международное агентство недвижимости. Подбираем и сопровождаем покупку квартир и домов в Дубае, Ереване, Тбилиси и Краснодаре.",
};

const values = [
  {
    title: "Честность",
    text: "Говорим о минусах объекта до сделки, а не после. Показываем реальные цены застройщиков — без наценок.",
  },
  {
    title: "Экспертиза",
    text: "Наши брокеры живут и работают в тех городах, где продают. Мы знаем каждый район, застройщика и очередь строительства.",
  },
  {
    title: "Забота",
    text: "Ведём клиента от первого звонка до передачи ключей — и остаёмся на связи после: аренда, управление, перепродажа.",
  },
];

const stats = [
  { value: "4", label: "страны присутствия" },
  { value: "0%", label: "комиссия для покупателя" },
  { value: "24 ч", label: "на персональную подборку" },
  { value: "100%", label: "сопровождение сделки под ключ" },
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="bg-brand py-16 text-white sm:py-20">
        <Reveal className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            О компании
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Помогаем находить дома мечты в четырёх странах
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-white/80">
            Elit Estate — международное агентство недвижимости. Мы объединили
            рынки Дубая, Еревана, Тбилиси и Краснодара в одном окне: сравниваем
            цены и доходность, подбираем объект под цели клиента и проводим
            сделку под ключ — в том числе полностью дистанционно.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <RevealStagger className="grid gap-6 rounded-3xl border border-line bg-card p-8 shadow-sm sm:grid-cols-4 sm:p-10">
          {stats.map((s) => (
            <RevealItem key={s.label} className="text-center">
              <p className="font-display text-4xl font-bold text-accent">
                <AnimatedNumber value={s.value} />
              </p>
              <p className="mt-2 text-sm text-muted">{s.label}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-brand">
              Как мы работаем
            </h2>
            <p className="mt-4 leading-relaxed text-foreground/80">
              Мы начинали как локальное агентство в Ереване и выросли в
              международную команду брокеров, юристов и аналитиков. Наша
              специализация — помощь русскоязычным покупателям, которые ищут
              квартиру для жизни, переезда или инвестиций за рубежом.
            </p>
            <p className="mt-4 leading-relaxed text-foreground/80">
              Мы не «продаём квадратные метры» — мы решаем задачу клиента.
              Иногда правильный ответ — не Дубай, а Тбилиси; не студия под
              аренду, а дом для семьи. Поэтому первый шаг любой сделки у нас —
              разговор о целях, а не показ каталога.
            </p>
            <ul className="mt-6 space-y-3">
              {values.map((v) => (
                <li key={v.title} className="rounded-2xl border border-line bg-card p-5">
                  <h3 className="font-bold text-brand">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{v.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.15} className="relative aspect-[3/4] overflow-hidden rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"
              alt="Команда Elit Estate"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-center text-3xl font-bold text-brand">
              Наши рынки
            </h2>
          </Reveal>
          <RevealStagger className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((c) => (
              <RevealItem key={c.slug}>
                <Link
                  href="/#podbor"
                  className="group block h-full rounded-2xl border border-line bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="text-3xl">{c.countryFlag}</span>
                  <h3 className="mt-3 text-lg font-bold text-brand group-hover:text-accent">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    {c.country}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{c.description}</p>
                </Link>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <Reveal className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold text-brand">
          Поговорим о вашей задаче?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Расскажите, что ищете — за 24 часа пришлём подборку, которая сэкономит
          вам недели самостоятельного поиска.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={CONTACT_PHONE_HREF}
            className="rounded-full bg-brand px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04] hover:bg-brand-light active:scale-[0.97]"
          >
            {CONTACT_PHONE}
          </a>
          <Link
            href="/contacts"
            className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04] hover:bg-accent-dark active:scale-[0.97]"
          >
            Оставить заявку
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
