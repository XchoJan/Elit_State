import Link from "next/link";
import Quiz from "@/components/Quiz";
import {
  cities,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  HERO_PROOF,
  WHATSAPP_HREF,
} from "@/lib/data";

// Первый экран сознательно собран без клиентского JS: разметка приходит с
// сервера уже видимой, фон — заранее сжатый webp из public (а не «на лету»
// через /_next/image). Единственный интерактивный кусок здесь — квиз.

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand">
      <img
        src="/img/hero-1280.webp"
        srcSet="/img/hero-768.webp 768w, /img/hero-1280.webp 1280w, /img/hero-1920.webp 1920w"
        sizes="100vw"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Фото — это атмосфера, а не содержание: гасим его, чтобы текст и
          карточка квиза читались даже на солнце с телефона. */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-deep/95 via-brand/88 to-brand-light/72" />
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-accent/25 blur-3xl animate-float-a" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14 lg:py-20">
        <div className="grid gap-7 lg:grid-cols-12 lg:gap-12">
          {/* Оффер */}
          <div className="anim-up lg:col-span-6 lg:self-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
              Дубай · Ереван · Грузия · Россия
            </p>
            <h1 className="font-display mt-4 text-[1.85rem] font-bold leading-[1.14] text-white sm:mt-5 sm:text-5xl lg:text-[3.4rem]">
              Подберём квартиру за рубежом —{" "}
              <span className="text-accent">бесплатно для вас</span>
            </h1>
            <p className="mt-3.5 max-w-xl text-[0.95rem] leading-relaxed text-white/80 sm:mt-4 sm:text-lg">
              Комиссию нам платит застройщик — цена для вас та же, что в его
              отделе продаж. Ответьте на 3 вопроса, и за сутки пришлём подборку
              с ценами и планировками.
              {/* На телефоне каждая строка отодвигает квиз ниже экрана,
                  поэтому продолжение показываем только на широких. */}
              <span className="hidden sm:inline">
                {" "}
                С честными комментариями по каждому варианту — включая те, что
                нам самим не нравятся.
              </span>
            </p>
          </div>

          {/* Квиз. На телефоне он идёт сразу за заголовком — так первое
              действие попадает на первый экран, а не через полторы прокрутки. */}
          <div
            id="podbor"
            className="anim-up anim-d2 scroll-mt-20 lg:col-span-6 lg:row-span-2 lg:self-center"
          >
            <Quiz subject="Квиз с первого экрана" />
          </div>

          {/* Доказательства и связь */}
          <div className="anim-up anim-d3 lg:col-span-6">
            <ul className="grid gap-2.5 sm:grid-cols-3 lg:gap-3">
              {HERO_PROOF.map((p) => (
                <li
                  key={p.title}
                  className="rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-sm font-bold text-accent">{p.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-white/70">{p.text}</p>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-whatsapp px-6 py-3 text-center text-sm font-semibold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
              >
                Спросить в WhatsApp
              </a>
              <a
                href={CONTACT_PHONE_HREF}
                className="rounded-full border border-white/30 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {CONTACT_PHONE}
              </a>
            </div>

            <nav className="mt-5 flex flex-wrap gap-2" aria-label="Направления">
              {cities.map((c) => (
                <Link
                  key={c.slug}
                  href={c.path}
                  className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-accent hover:text-white"
                >
                  {c.countryFlag} {c.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
