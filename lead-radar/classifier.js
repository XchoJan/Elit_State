// AI-классификатор находок.
//
// Словари из keywords.js отвечают на вопрос «есть ли в тексте нужные слова».
// Этого мало: «ищу квартиру снять на месяц» и «ищу квартиру купить, бюджет
// 300к» состоят из одних и тех же слов, а клиент — только второй. Модель
// понимает смысл и отличает одно от другого, а заодно вытаскивает город,
// бюджет и срок, чтобы менеджер сразу видел, с чем идти к человеку.
//
// Словари при этом остаются: они работают предфильтром и отсекают ~95%
// сообщений до вызова модели. Без них классификатор разбирал бы каждое
// «всем привет» — дорого и бессмысленно.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

export const AI_ENABLED = Boolean(process.env.ANTHROPIC_API_KEY);

/** Ниже этого балла модели находка не показывается. */
export const AI_MIN_SCORE = Number(process.env.AI_MIN_SCORE ?? 55);

const MODEL = process.env.AI_MODEL ?? "claude-opus-5";

const client = AI_ENABLED ? new Anthropic() : null;

// Схема ответа. Модель обязана вернуть ровно эти поля — structured output
// гарантирует форму, поэтому разбирать текст руками не нужно.
const LeadSchema = z.object({
  is_lead: z.boolean(),
  lead_score: z.number(),
  temperature: z.enum(["HOT", "WARM", "LOW", "NOISE"]),
  intent: z.enum([
    "BUY",
    "SELL",
    "RENT",
    "HIRE",
    "LOOKING_FOR",
    "QUESTION",
    "RESEARCH",
    "ADVERTISEMENT",
    "OTHER",
  ]),
  category: z.string(),
  location: z.string(),
  budget: z.string(),
  currency: z.string(),
  timeframe: z.string(),
  requirements: z.array(z.string()),
  language: z.string(),
  reason: z.string(),
  sales_angle: z.string(),
  confidence: z.number(),
});

// Системный промпт неизменен от вызова к вызову — помечаем его для кеширования.
// При тысячах разборов в месяц это снимает основную часть стоимости входа.
const SYSTEM = `Ты — аналитик отдела продаж международного агентства недвижимости Elite Estate.

Агентство ПРОДАЁТ недвижимость в четырёх странах:
- ОАЭ (Дубай) — квартиры, виллы, инвестиции, резидентская виза
- Армения (Ереван) — квартиры, новостройки, ВНЖ
- Грузия (Тбилиси, Батуми) — квартиры, инвестиции, ВНЖ
- Россия (Краснодар, Сочи, Москва, Санкт-Петербург) — новостройки

Тебе дают публичное сообщение из чата или с сайта. Определи, является ли автор
потенциальным ПОКУПАТЕЛЕМ недвижимости прямо сейчас.

КТО НУЖЕН:
- хочет купить жильё для себя или семьи
- ищет объект под инвестиции, спрашивает про доходность и окупаемость
- подбирает риэлтора, брокера или агентство для покупки
- интересуется ВНЖ или резидентской визой ЧЕРЕЗ покупку недвижимости

КТО НЕ НУЖЕН (is_lead = false):
- ищет аренду, хочет снять или сдать
- продаёт свой объект
- агент, риэлтор или застройщик, рекламирующий услуги и объекты
- ищет работу, подработку, клиентов или заказы
- обсуждает рынок отвлечённо, без намерения купить
- спрашивает про визы, налоги или переезд без связи с покупкой жилья
- туристические вопросы: отели, билеты, что посмотреть

ОЦЕНКА lead_score от 0 до 100:
+30 явное намерение купить
+20 назван бюджет
+15 назван город или район
+10 назван тип недвижимости
+10 назван срок покупки
+10 конкретные требования
+5 задаёт вопрос о покупке

temperature: 90-100 HOT, 70-89 WARM, 40-69 LOW, 0-39 NOISE.

География за пределами четырёх стран агентства — это НЕ лид, каким бы явным
ни было намерение: работать с таким клиентом агентство не сможет.

Поля, которых в сообщении нет, заполняй пустой строкой или пустым массивом —
ничего не выдумывай. reason — одно предложение о том, почему решил так.
sales_angle — что конкретно предложить этому человеку в первом ответе.
Отвечай на русском языке.`;

/**
 * Разбирает одно сообщение. Возвращает null, если модель недоступна или
 * упала — вызывающий код тогда откатывается на оценку по словарям, чтобы
 * сбой AI не приводил к потере лидов.
 */
export async function classify({ text, chatTitle = "", source = "Telegram" }) {
  if (!client) return null;

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      // Классификация короткого текста — простая задача; низкий effort
      // снижает и задержку, и стоимость без потери качества.
      output_config: { effort: "low", format: zodOutputFormat(LeadSchema) },
      messages: [
        {
          role: "user",
          content: `Источник: ${source}\nЧат или площадка: ${chatTitle || "неизвестно"}\n\nСообщение:\n"""\n${text.slice(0, 4000)}\n"""`,
        },
      ],
    });

    return response.parsed_output ?? null;
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      console.warn("AI: превышен лимит запросов, откат на словари");
    } else if (e instanceof Anthropic.AuthenticationError) {
      console.error("AI: неверный ANTHROPIC_API_KEY");
    } else if (e instanceof Anthropic.APIError) {
      console.error(`AI: ошибка ${e.status}: ${e.message}`);
    } else {
      console.error("AI: непредвиденная ошибка:", e?.message ?? e);
    }
    return null;
  }
}

/** Значок по температуре — тот же язык, что и у словарного скоринга. */
export function temperatureBadge(temperature) {
  return { HOT: "🔥", WARM: "🟡", LOW: "⚪️", NOISE: "⚫️" }[temperature] ?? "⚪️";
}

/** Карточка лида для уведомления — то, с чем менеджер идёт к человеку. */
export function formatCard(ai, escape) {
  const line = (label, value) =>
    value && String(value).trim() ? `${label}: ${escape(String(value))}` : null;

  return [
    line("🎯 Намерение", ai.intent),
    line("📍 Локация", ai.location),
    line("💰 Бюджет", [ai.budget, ai.currency].filter(Boolean).join(" ")),
    line("⏳ Срок", ai.timeframe),
    ai.requirements?.length
      ? `📋 Требования: ${escape(ai.requirements.join(", "))}`
      : null,
    line("💡 Что предложить", ai.sales_angle),
  ].filter(Boolean);
}
