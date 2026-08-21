import Link from "next/link";
import Hero from "@/components/Hero";
import BudgetExplorer from "@/components/BudgetExplorer";
import FloorPlans from "@/components/FloorPlans";
import LeadForm from "@/components/LeadForm";
import { Reveal, RevealItem, RevealStagger } from "@/components/Reveal";
import {
  cities,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  STATS_DISCLAIMER,
  WHATSAPP_HREF,
} from "@/lib/data";

// Первое, что человек читает после первого экрана, — не рассказ о нас, а
// ответы на вопросы, из-за которых он закрывает вкладку. Порядок именно
// такой: снять страх → показать пользу → и только потом «почему мы».
const objections = [
  {
    q: "Сколько стоят ваши услуги?",
    a: "Нисколько. Комиссию нам платит застройщик, а цена квартиры для вас остаётся ровно такой же, как при прямом обращении в его отдел продаж.",
  },
  {
    q: "Мне начнут названивать?",
    a: "Нет. В заявке вы сами выбираете, куда писать — WhatsApp, Telegram или всё-таки звонок. Общается живой менеджер, автообзвона и рассылок у нас нет.",
  },
  {
    q: "А если я ещё только присматриваюсь?",
    a: "Это нормально: между первым запросом и сделкой обычно проходят месяцы. Подборка ни к чему не обязывает — можно просто посмотреть цифры по рынку и вернуться позже.",
  },
  {
    q: "Можно купить, не вылетая в страну?",
    a: "Да. Показываем объекты по видеосвязи, бронируем, оформляем по доверенности или через электронную регистрацию. Личный визит обычно нужен только для банка и визы.",
  },
  {
    q: "Что, если объект окажется неудачным?",
    a: "Считаем доходность и потенциал роста цены до покупки, а не после. Если вариант плохой — прямо об этом скажем и предложим другой: нам важнее сделка, которой вы будете довольны.",
  },
  {
    q: "Почему сразу четыре страны?",
    a: "Потому что задача у всех разная: где-то важнее ВНЖ, где-то доходность, где-то бюджет входа. Мы сравниваем рынки между собой и честно говорим, где ваша задача решается лучше.",
  },
];

const advantages = [
  {
    title: "Доступ к базам застройщиков",
    text: "Работаем напрямую с отделами продаж: свежие остатки, старты продаж и закрытые скидки — то, чего нет в открытых каталогах.",
  },
  {
    title: "Подбор под ваш вкус",
    text: "Не листайте сотни объявлений. Расскажите, что важно именно вам — пришлём только подходящие варианты с фото и планировками.",
  },
  {
    title: "Сделка под ключ",
    text: "Проверка объекта и документов, договор, переводы, регистрация права собственности — берём всю рутину на себя.",
  },
  {
    title: "Инвестиционный подход",
    text: "Считаем доходность аренды и потенциал роста цены до покупки, а не после. Отговорим от плохого варианта.",
  },
  {
    title: "Дистанционные сделки",
    text: "Покупка без вылета: онлайн-показы по видеосвязи, доверенность, электронная регистрация.",
  },
  {
    title: "Сервис после покупки",
    text: "Ремонт, меблировка, сдача в аренду и управление недвижимостью — остаёмся на связи и после сделки.",
  },
];

const steps = [
  {
    n: "01",
    title: "Заявка",
    text: "Три вопроса в форме выше или сообщение в WhatsApp — обсудим бюджет и цели покупки.",
  },
  {
    n: "02",
    title: "Подборка",
    text: "За 24 часа пришлём персональную подборку с ценами, фото и планировками.",
  },
  {
    n: "03",
    title: "Показ",
    text: "Организуем показ — лично или онлайн по видеосвязи из любой точки мира.",
  },
  {
    n: "04",
    title: "Сделка",
    text: "Проверим документы, проведём сделку и передадим вам ключи. Поздравляем!",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />

      {/* Возражения — сразу после первого экрана */}
      <section className="border-b border-line bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Без мелкого шрифта
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-brand sm:text-4xl">
              Шесть вопросов, которые вы бы задали первыми
            </h2>
          </Reveal>
          <RevealStagger className="mt-9 grid gap-x-10 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
            {objections.map((o) => (
              <RevealItem key={o.q}>
                <h3 className="text-base font-bold text-brand">{o.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{o.a}</p>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Калькулятор бюджета */}
      <section id="budget" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Сравнение рынков
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-brand sm:text-4xl">
              Что ваши деньги дают в каждой стране
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Одна и та же сумма — это студия в Дубае, двушка в центре Еревана
              или дом под Батуми. Посмотрите сами, прежде чем говорить с
              менеджером.
            </p>
          </Reveal>
          <Reveal className="mt-9">
            <BudgetExplorer />
          </Reveal>
        </div>
      </section>

      {/* Направления */}
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
              Сравните направления и решите, что ближе вам — а мы подскажем, где
              ваша задача решается лучше всего.
            </p>
          </Reveal>

          <RevealStagger className="mt-10 grid gap-6 md:grid-cols-2">
            {cities.map((c) => (
              <RevealItem
                key={c.slug}
                className="flex h-full flex-col rounded-3xl border border-line bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.countryFlag}</span>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-brand">
                      {c.name}
                    </h3>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {c.country ? `${c.country} · ${c.tagline}` : c.tagline}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {c.description}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
                  {c.stats.map((s) => (
                    <div key={s.label}>
                      <p className="text-lg font-bold leading-tight text-brand">
                        {s.value}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-xl bg-accent/10 px-4 py-3">
                  <span className="text-sm">⭐</span>
                  <p className="text-sm font-medium text-accent-dark">{c.highlight}</p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5">
                  <a
                    href="#podbor"
                    className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
                  >
                    Подобрать {c.nameIn}
                  </a>
                  <Link
                    href={c.path}
                    className="text-sm font-semibold text-brand transition-colors hover:text-accent"
                  >
                    Подробнее о рынке →
                  </Link>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>

          <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-muted">
            {STATS_DISCLAIMER}
          </p>
        </div>
      </section>

      {/* Планировки */}
      <section id="planirovki" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Планировки
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-brand sm:text-4xl">
              Что помещается в 50, 60 и 70 м²
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              Одна и та же площадь раскладывается по-разному. Посмотрите типовые
              решения — и скажите менеджеру, какое вам ближе.
            </p>
          </Reveal>

          <Reveal className="mt-10">
            <FloorPlans />
          </Reveal>

          <Reveal className="mt-10 text-center">
            <p className="mx-auto max-w-2xl text-xs leading-relaxed text-muted">
              Схемы типовые и приведены для наглядности — это не конкретные
              объекты в продаже. Планировки реальных квартир пришлём в подборке.
            </p>
            <a
              href="#podbor"
              className="mt-5 inline-block rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04] hover:bg-accent-dark active:scale-[0.97]"
            >
              Подобрать квартиру под мою задачу
            </a>
          </Reveal>
        </div>
      </section>

      {/* Преимущества */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Почему Elite Estate
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold text-brand sm:text-4xl">
            Что мы берём на себя
          </h2>
        </Reveal>
        <RevealStagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {advantages.map((a) => (
            <RevealItem
              key={a.title}
              className="h-full rounded-2xl border border-line bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-brand">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a.text}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      {/* Как работаем */}
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
              <RevealItem key={s.n}>
                <span className="font-display text-5xl font-bold text-accent/40">
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{s.text}</p>
              </RevealItem>
            ))}
          </RevealStagger>
          <Reveal className="mt-12 text-center">
            <a
              href="#podbor"
              className="pulse-accent inline-block rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04] hover:bg-accent-dark active:scale-[0.97]"
            >
              Начать подбор
            </a>
          </Reveal>
        </div>
      </section>

      {/* Финальный контакт */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="grid items-center gap-10 rounded-3xl border border-line bg-white p-8 shadow-sm sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-brand sm:text-4xl">
              Удобнее просто написать?
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Напишите в WhatsApp или позвоните — менеджер ответит на вопросы,
              расскажет про направления и пришлёт первые варианты прямо в
              переписке. Или оставьте контакт, и мы напишем сами.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-whatsapp px-6 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:opacity-90 active:scale-[0.97]"
              >
                Написать в WhatsApp
              </a>
              <a
                href={CONTACT_PHONE_HREF}
                className="rounded-full bg-brand px-6 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-brand-light active:scale-[0.97]"
              >
                {CONTACT_PHONE}
              </a>
            </div>
          </div>
          <LeadForm subject="Заявка с главной страницы" />
        </Reveal>
      </section>
    </main>
  );
}
