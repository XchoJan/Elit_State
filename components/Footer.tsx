import Link from "next/link";
import { cities, CONTACT_PHONE, CONTACT_PHONE_HREF, INSTAGRAM_HREF, WHATSAPP_HREF } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="mt-auto bg-brand text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold">Elite</span>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Estate
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Международное агентство недвижимости. Помогаем купить квартиру, дом
            или инвестиционный объект в Дубае, Ереване, Грузии и России.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Города
          </h3>
          <ul className="mt-4 space-y-2.5">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link
                  href="/#cities"
                  className="text-sm text-white/80 transition-colors hover:text-accent"
                >
                  {c.country ? `${c.name}, ${c.country}` : c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Разделы
          </h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/#podbor" className="text-sm text-white/80 transition-colors hover:text-accent">
                Подбор недвижимости
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-sm text-white/80 transition-colors hover:text-accent">
                О компании
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="text-sm text-white/80 transition-colors hover:text-accent">
                Контакты
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Связаться с нами
          </h3>
          <a
            href={CONTACT_PHONE_HREF}
            className="mt-4 block text-lg font-semibold transition-colors hover:text-accent"
          >
            {CONTACT_PHONE}
          </a>
          <p className="mt-1 text-sm text-white/60">24/7 — бесплатная консультация</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.05] hover:opacity-90 active:scale-[0.96]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </a>
            <a
              href={INSTAGRAM_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.05] hover:opacity-90 active:scale-[0.96]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069M12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0m0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324M12 16a4 4 0 110-8 4 4 0 010 8m6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881" />
              </svg>
              Instagram
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} Elite Estate. Все права защищены.</span>
          <span>
            Рыночные ориентиры на сайте — по открытым данным; условия конкретных
            объектов уточняйте у менеджера.
          </span>
        </div>
      </div>
    </footer>
  );
}
