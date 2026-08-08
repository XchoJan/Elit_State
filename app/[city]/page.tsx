import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Quiz from "@/components/Quiz";
import LeadForm from "@/components/LeadForm";
import JsonLd from "@/components/JsonLd";
import { Reveal, RevealItem, RevealStagger } from "@/components/Reveal";
import {
  cities,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  getCityByPath,
  STATS_DISCLAIMER,
  WHATSAPP_HREF,
} from "@/lib/data";
import { breadcrumbsJsonLd, faqJsonLd } from "@/lib/seo";

// Страницы известны заранее — генерируем на сборке, всё остальное отдаёт 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return cities.map((c) => ({ city: c.path.replace("/", "") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityByPath(slug);
  if (!city) return {};

  return {
    // absolute отключает шаблон «%s — Elite Estate»: в выдаче видно около
    // 60 символов, и приписка съедала бы ключевые слова.
    title: { absolute: city.seoTitle },
    description: city.seoDescription,
    alternates: { canonical: city.path },
    openGraph: {
      title: city.seoTitle,
      description: city.seoDescription,
      url: city.path,
      type: "website",
      locale: "ru_RU",
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = getCityByPath(slug);
  if (!city) notFound();

  const others = cities.filter((c) => c.slug !== city.slug);

  return (
    <main className="flex-1">
      <JsonLd
        data={[
          faqJsonLd(city.faq),
          breadcrumbsJsonLd([
            { name: "Главная", path: "/" },
            { name: city.name, path: city.path },
          ]),
        ]}
      />

      {/* Первый экран */}
      <section className="relative overflow-hidden bg-brand text-white">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-float-a" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-float-b" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <nav aria-label="Хлебные крошки" className="text-sm text-white/60">
            <Link href="/" className="transition-colors hover:text-accent">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">{city.name}</span>
          </nav>

          <div className="mt-8 grid items-start gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-sm">
                <span className="text-base">{city.countryFlag}</span>
                {city.country || city.name}
              </p>
              <h1 className="font-display mt-6 text-4xl font-bold leading-tight sm:text-5xl">
                {city.h1}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-white/85 sm:text-lg">
                {city.lead}
              </p>

              <div className="mt-8 grid grid-cols-3 gap-5 border-y border-white/15 py-6">
                {city.stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-bold leading-tight text-accent sm:text-2xl">
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-white/70">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#podbor"
                  className="rounded-full bg-accent px-8 py-3.5 text-center text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.04] hover:bg-accent-dark active:scale-[0.97]"
                >
                  Получить подборку {city.nameIn}
                </a>
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/40 bg-white/10 px-8 py-3.5 text-center text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:scale-[1.04] hover:bg-white/20 active:scale-[0.97]"
                >
                  Спросить в WhatsApp
                </a>
              </div>
            </Reveal>

            {/* Квиз сразу на первом экране: город уже известен из адреса,
                поэтому человек начинает с вопроса о цели покупки. */}
            <Reveal delay={0.15} id="podbor" className="scroll-mt-20">
              <Quiz city={city.slug} subject={`Квиз — ${city.name}`} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Почему именно здесь */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Почему {city.name}
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-brand sm:text-4xl">
              {city.tagline}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl leading-relaxed text-muted">
              {city.description}
            </p>
          </Reveal>

          <RevealStagger className="mt-10 grid gap-6 sm:grid-cols-2">
            {city.reasons.map((r) => (
              <RevealItem
                key={r.title}
                className="rounded-2xl border border-line bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="text-lg font-bold text-brand">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.text}</p>
              </RevealItem>
            ))}
          </RevealStagger>

          <Reveal delay={0.15} className="mt-8">
            <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl bg-accent/10 px-6 py-5">
              <span className="text-lg">⭐</span>
              <p className="text-sm font-medium text-accent-dark">{city.highlight}</p>
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-muted">
              {STATS_DISCLAIMER}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Вопросы и ответы */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Частые вопросы
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold text-brand sm:text-4xl">
            Что спрашивают о покупке {city.nameIn}
          </h2>
        </Reveal>

        <RevealStagger className="mx-auto mt-10 max-w-3xl space-y-3">
          {city.faq.map((item) => (
            <RevealItem key={item.q}>
              <details className="group rounded-2xl border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-brand">
                  {item.q}
                  <span className="mt-0.5 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      {/* Другие направления — перелинковка, она же помогает поисковикам */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="text-center">
            <h2 className="font-display text-2xl font-bold text-brand sm:text-3xl">
              Смотрите ещё и здесь
            </h2>
            <p className="mt-3 text-muted">
              Мы работаем с четырьмя рынками сразу — и честно скажем, где ваша
              задача решается лучше.
            </p>
          </Reveal>
          <RevealStagger className="mt-8 grid gap-4 sm:grid-cols-3">
            {others.map((c) => (
              <RevealItem key={c.slug}>
                <Link
                  href={c.path}
                  className="flex h-full flex-col rounded-2xl border border-line bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-md"
                >
                  <span className="text-3xl">{c.countryFlag}</span>
                  <p className="mt-3 text-lg font-bold text-brand">
                    Недвижимость {c.nameIn}
                  </p>
                  <p className="mt-1 text-sm text-muted">{c.tagline}</p>
                </Link>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Заявка */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="grid items-center gap-10 rounded-3xl border border-line bg-white p-8 shadow-sm sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-brand sm:text-4xl">
              Обсудим покупку {city.nameIn}?
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Оставьте номер — менеджер перезвонит, ответит на вопросы и пришлёт
              первые варианты с ценами и планировками. Или позвоните сами,
              мы на связи круглосуточно.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={CONTACT_PHONE_HREF}
                className="rounded-full bg-brand px-6 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-brand-light active:scale-[0.97]"
              >
                {CONTACT_PHONE}
              </a>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366] px-6 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:opacity-90 active:scale-[0.97]"
              >
                Написать в WhatsApp
              </a>
            </div>
          </div>
          <LeadForm subject={`Заявка — ${city.name}`} />
        </Reveal>
      </section>
    </main>
  );
}
