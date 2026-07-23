import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import { Reveal, RevealItem, RevealStagger } from "@/components/Reveal";
import { CONTACT_PHONE, CONTACT_PHONE_HREF, INSTAGRAM_HREF, WHATSAPP_HREF } from "@/lib/data";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Свяжитесь с Elit Estate: телефон +374 91 446615, WhatsApp, форма заявки. Работаем 24/7 — бесплатная консультация.",
};

export default function ContactsPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Контакты
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold text-brand sm:text-4xl">
            Мы всегда на связи
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Позвоните, напишите в WhatsApp или оставьте заявку — менеджер ответит
            в течение 15 минут, круглосуточно.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <RevealStagger className="space-y-4">
            <RevealItem>
              <a
                href={CONTACT_PHONE_HREF}
                className="block rounded-2xl border border-line bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Телефон
                </p>
                <p className="mt-2 text-2xl font-bold text-brand">{CONTACT_PHONE}</p>
                <p className="mt-1 text-sm text-muted">24/7 — бесплатная консультация</p>
              </a>
            </RevealItem>

            <RevealItem>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-line bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  WhatsApp
                </p>
                <p className="mt-2 text-2xl font-bold text-[#25D366]">Написать в чат</p>
                <p className="mt-1 text-sm text-muted">
                  Отвечаем быстро — обычно в течение нескольких минут
                </p>
              </a>
            </RevealItem>

            <RevealItem>
              <a
                href={INSTAGRAM_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-line bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Instagram
                </p>
                <p className="mt-2 text-2xl font-bold text-brand">@elit_state</p>
                <p className="mt-1 text-sm text-muted">
                  Свежие объекты и обзоры районов — подписывайтесь
                </p>
              </a>
            </RevealItem>

            <RevealItem>
              <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Офисы
                </p>
                <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                  <li>🇦🇲 Ереван — центральный офис</li>
                  <li>🇦🇪 Дубай — партнёрский офис</li>
                  <li>🇬🇪 Грузия — партнёрский офис</li>
                  <li>🇷🇺 Россия — партнёрский офис</li>
                </ul>
              </div>
            </RevealItem>
          </RevealStagger>

          <Reveal delay={0.15} className="rounded-3xl border border-line bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-brand">
              Оставить заявку
            </h2>
            <p className="mt-2 text-sm text-muted">
              Опишите, что ищете — город, бюджет, цель покупки. Пришлём
              персональную подборку в течение 24 часов.
            </p>
            <div className="mt-6">
              <LeadForm subject="Заявка со страницы контактов" />
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
