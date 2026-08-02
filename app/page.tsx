import Hero from "@/components/Hero";
import Quiz from "@/components/Quiz";
import LeadForm from "@/components/LeadForm";
import AnimatedNumber from "@/components/AnimatedNumber";
import { Reveal, RevealItem, RevealStagger } from "@/components/Reveal";
import {
  cities,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  STATS_DISCLAIMER,
  WHATSAPP_HREF,
} from "@/lib/data";

const promises = [
  { value: "4 страны", label: "Дубай, Ереван, Грузия и Россия — в одном окне" },
  { value: "0%", label: "Комиссия для покупателя — цены как у застройщика" },
  { value: "24 часа", label: "И персональная подборка объектов у вас в WhatsApp" },
  { value: "Дистанционно", label: "Онлайн-показы и сделки без вылета" },
];

const advantages = [
  {
    icon: "🏙️",
    title: "Доступ к базам застройщиков",
    text: "Работаем напрямую с отделами продаж: свежие остатки, старты продаж и закрытые скидки — то, чего нет в открытых каталогах.",
  },
  {
    icon: "🎯",
    title: "Подбор под ваш вкус",
    text: "Не листайте сотни объявлений. Расскажите, что важно именно вам — пришлём только подходящие варианты с фото и планировками.",
  },
  {
    icon: "📄",
    title: "Сделка под ключ",
    text: "Проверка объекта и документов, договор, переводы, регистрация права собственности — берём всю рутину на себя.",
  },
  {
    icon: "📈",
    title: "Инвестиционный подход",
    text: "Считаем доходность аренды и потенциал роста цены до покупки, а не после. Отговорим от плохого варианта.",
  },
  {
    icon: "✈️",
    title: "Дистанционные сделки",
    text: "Покупка без вылета: онлайн-показы по видеосвязи, доверенность, электронная регистрация.",
  },
  {
    icon: "🔑",
    title: "Сервис после покупки",
    text: "Ремонт, меблировка, сдача в аренду и управление недвижимостью — остаёмся на связи и после сделки.",
  },
];

const steps = [
  { n: "01", title: "Заявка", text: "Пройдите подбор за 1 минуту или напишите в WhatsApp — обсудим бюджет и цели покупки." },
  { n: "02", title: "Подборка", text: "За 24 часа пришлём персональную подборку с ценами, фото и планировками." },
  { n: "03", title: "Показ", text: "Организуем показ — лично или онлайн по видеосвязи из любой точки мира." },
  { n: "04", title: "Сделка", text: "Проверим документы, проведём сделку и передадим вам ключи. Поздравляем!" },
];

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />

      {/* Promises strip */}
      <section className="border-b border-line bg-white">
        <RevealStagger className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {promises.map((p) => (
            <RevealItem key={p.value}>
              <p className="text-2xl font-bold text-brand">
                <AnimatedNumber value={p.value} />
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.label}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      {/* Quiz */}
      <section id="podbor" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Бесплатный подбор
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-brand sm:text-4xl">
              Ответьте на 4 вопроса — остальное сделаем мы
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              У каждого «дома мечты» свой рецепт: кому-то — вид на море и терраса,
              кому-то — доходность и рассрочка. Вместо каталога из тысячи чужих
              объявлений мы собираем подборку под вас: только свежие предложения
              застройщиков, актуальные цены и честные комментарии по каждому
              варианту.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Подборка бесплатна и ни к чему не обязывает",
                "Только реальные объекты в продаже — без «заманух»",
                "Пришлём в WhatsApp: фото, планировки, цены",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs text-accent-dark">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-3">
            <Quiz />
          </Reveal>
        </div>
      </section>

      {/* Cities infographic */}
      <section id="cities" className="scroll-mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              География
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-brand sm:text-4xl">
              Четыре рынка — четыре разные стратегии
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              Сравните города и решите, что ближе вам — а мы подскажем, где ваша
              задача решается лучше всего.
            </p>
          </Reveal>

          <RevealStagger className="mt-10 grid gap-6 md:grid-cols-2">
            {cities.map((c) => (
              <RevealItem
                key={c.slug}
                className="flex flex-col rounded-3xl border border-line bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.countryFlag}</span>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-brand">{c.name}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {c.country ? `${c.country} · ${c.tagline}` : c.tagline}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">{c.description}</p>

                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
                  {c.stats.map((s) => (
                    <div key={s.label}>
                      <p className="text-lg font-bold leading-tight text-brand">{s.value}</p>
                      <p className="mt-1 text-xs leading-snug text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-xl bg-accent/10 px-4 py-3">
                  <span className="text-sm">⭐</span>
                  <p className="text-sm font-medium text-accent-dark">{c.highlight}</p>
                </div>

                <a
                  href="#podbor"
                  className="mt-5 inline-block text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
                >
                  Подобрать {c.nameIn} →
                </a>
              </RevealItem>
            ))}
          </RevealStagger>

          <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-muted">
            {STATS_DISCLAIMER}
          </p>
        </div>
      </section>

      {/* Advantages */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Почему Elite Estate
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold text-brand sm:text-4xl">
            Покупка недвижимости — это просто
          </h2>
        </Reveal>
        <RevealStagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {advantages.map((a) => (
            <RevealItem
              key={a.title}
              className="rounded-2xl border border-line bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-3xl">{a.icon}</span>
              <h3 className="mt-4 text-lg font-bold text-brand">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a.text}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      {/* Steps */}
      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Как мы работаем
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">
              4 шага до ключей
            </h2>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <RevealItem key={s.n} className="relative">
                <span className="font-display text-5xl font-bold text-accent/40">{s.n}</span>
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{s.text}</p>
              </RevealItem>
            ))}
          </RevealStagger>
          <Reveal delay={0.2} className="mt-12 text-center">
            <a
              href="#podbor"
              className="inline-block rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04] hover:bg-accent-dark active:scale-[0.97]"
            >
              Начать подбор
            </a>
          </Reveal>
        </div>
      </section>

      {/* CTA + Lead form */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="grid items-center gap-10 rounded-3xl border border-line bg-white p-8 shadow-sm sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-brand sm:text-4xl">
              Удобнее поговорить голосом?
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Позвоните или напишите в WhatsApp — менеджер ответит на вопросы,
              расскажет про города и пришлёт первые варианты уже в этом разговоре.
              Или оставьте номер, и мы перезвоним сами.
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
          <LeadForm subject="Заявка с главной страницы" />
        </Reveal>
      </section>
    </main>
  );
}
