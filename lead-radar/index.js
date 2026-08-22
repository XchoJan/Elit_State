// Lead radar — слушает Telegram-чаты, в которых вы состоите, и присылает
// вам сообщения, похожие на запрос клиента.
//
// Тем может быть несколько, и у каждой свой чат для находок: недвижимость —
// в один, заказы на разработку — в другой. Что именно ищется и куда уходит,
// описано в profiles.js; этот файл про темы ничего не знает и просто гоняет
// каждое сообщение через все включённые профили.
//
// Что он делает: читает поток новых сообщений вашим же аккаунтом (как если бы
// вы сами листали чаты), фильтрует по словарям профиля и пересылает
// подходящее вашему боту со ссылкой на оригинал.
//
// Чего он НЕ делает и делать не должен: не пишет никому автоматически.
// Отвечает человек, руками, по правилам конкретного чата. Автоответы и
// рассылки в личку — прямой путь к бану аккаунта и к тому, что администраторы
// закроют вам вход в лучшие чаты. Инструмент экономит время на поиске,
// а не заменяет разговор.

import "dotenv/config";
// teleproto — поддерживаемый форк GramJS: сам GramJS (пакет telegram) заархивирован.
import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";
import { NewMessage } from "teleproto/events/index.js";
import { PROFILES, DISABLED_PROFILES, isOwnChat } from "./profiles.js";
import { loadSeen, markSeen, runGlobalSearch, buildQueue } from "./globalSearch.js";
import { AI_ENABLED, AI_MIN_SCORE, classify, formatCard, temperatureBadge } from "./classifier.js";

const apiId = Number(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH;
const session = process.env.TG_SESSION;
const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Пустой список = слушаем все чаты, где вы состоите.
const WATCH = (process.env.TG_WATCH_CHATS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Не больше N уведомлений в минуту НА ТЕМУ: если словари настроены слишком
// широко, лучше упереться в потолок, чем получить 500 сообщений и всё
// выключить. Счётчик отдельный для каждой темы — разговорчивая разработка
// не должна съедать лимит недвижимости.
const MAX_ALERTS_PER_MINUTE = Number(process.env.MAX_ALERTS_PER_MINUTE ?? 12);

if (!apiId || !apiHash || !session) {
  console.error(
    "Не заданы TG_API_ID / TG_API_HASH / TG_SESSION.\n" +
      "Получите api_id и api_hash на https://my.telegram.org → API development tools,\n" +
      "затем выполните: npm run login"
  );
  process.exit(1);
}

if (!botToken) {
  console.error(
    "Не задан TELEGRAM_BOT_TOKEN — нечем присылать находки.\n" +
      "Возьмите то же значение, что и для сайта (.env.local)."
  );
  process.exit(1);
}

if (!PROFILES.length) {
  console.error(
    "Ни одной темы не настроено — некуда присылать находки.\n" +
      "Задайте TELEGRAM_CHAT_ID (недвижимость) и/или TELEGRAM_CHAT_ID_DEV (разработка)."
  );
  process.exit(1);
}

// Раз в полчаса пишем в лог, сколько сообщений просмотрено и сколько совпало.
// Без этого «ноль находок» невозможно отличить от «радар отвалился и молчит» —
// а это две совершенно разные ситуации с разными действиями.
const STATS_INTERVAL_MIN = Number(process.env.STATS_INTERVAL_MIN ?? 30);
const stats = { seen: 0, aiChecked: 0, aiRejected: 0, aiFailed: 0 };
/** Совпадений по каждой теме отдельно: видно, какая из них приносит поток. */
const matchedByProfile = new Map(PROFILES.map((p) => [p.id, 0]));

// Сколько интервалов подряд без единого сообщения считать поломкой.
// Ровно эта ситуация уже случалась: процесс «online», а сообщений не видит.
// Молчание радара неотличимо от затишья в чатах, поэтому он должен
// сам сказать, что ослеп, — иначе вы неделю ждёте лидов от мёртвого инструмента.
const SILENT_INTERVALS_TO_ALARM = 3;

// Ниже этого балла находки не присылаем. Холодные («⚪️») — это общие
// вопросы вроде «сколько стоит квартира», по которым разговор почти никогда
// не доходит до сделки. Их поток и создаёт ощущение, что радар шлёт мусор.
// 4 балла — это уровень 🟡: назван бюджет, или конкретика, или явное намерение.
const ALERT_MIN_SCORE = Number(process.env.ALERT_MIN_SCORE ?? 4);
let silentIntervals = 0;
let alarmSent = false;

/** Отметки времени отправок по каждой теме — для потолка в минуту. */
const alertTimestamps = new Map(PROFILES.map((p) => [p.id, []]));

function rateLimited(profileId) {
  const marks = alertTimestamps.get(profileId) ?? [];
  const now = Date.now();
  while (marks.length && now - marks[0] > 60_000) marks.shift();
  if (marks.length >= MAX_ALERTS_PER_MINUTE) return true;
  marks.push(now);
  return false;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendTo(chatId, text, attempt = 0) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    }),
  });
  if (res.ok) return;

  const body = await res.text();
  // Бот не может слать в группу быстрее ~20 сообщений в минуту. Telegram
  // честно говорит, сколько ждать, — надо послушаться, иначе находка пропадёт.
  const retryAfter = /"retry_after":(\d+)/.exec(body)?.[1];
  if (retryAfter && attempt < 3) {
    await new Promise((r) => setTimeout(r, (Number(retryAfter) + 1) * 1000));
    return sendTo(chatId, text, attempt + 1);
  }
  console.error(`Telegram API (чат ${chatId}):`, body);
}

/** Находка уходит только в чаты своей темы. */
async function notify(profile, text) {
  await Promise.all(profile.chatIds.map((id) => sendTo(id, text)));
}

/** Служебные сообщения (запуск, «радар ослеп») касаются всех тем. */
async function notifyAll(text) {
  await Promise.all(PROFILES.map((p) => notify(p, text)));
}

/**
 * Ссылка на конкретное сообщение: публичные чаты по имени, приватные — через /c/.
 * Если чат разрешить не удалось, id берём прямо из сообщения: ссылка нужнее
 * названия, по ней всё равно можно открыть переписку.
 */
function messageLink(chat, message) {
  const messageId = message.id;
  if (chat?.username) return `https://t.me/${chat.username}/${messageId}`;

  const rawId = chat?.id ?? message.peerId?.channelId ?? message.peerId?.chatId;
  if (rawId) return `https://t.me/c/${String(rawId).replace("-100", "")}/${messageId}`;
  return null;
}

/**
 * Автор сообщения. В разных версиях библиотеки метод живёт то на событии,
 * то на самом сообщении, а отсутствующий метод даёт синхронный TypeError —
 * его не поймает .catch(). Поэтому проверяем наличие метода до вызова.
 */
async function resolveSender(event, message) {
  try {
    if (typeof message?.getSender === "function") return await message.getSender();
    if (typeof event?.getSender === "function") return await event.getSender();
  } catch {
    // не удалось — уведомление уйдёт без имени автора, это не повод его терять
  }
  return null;
}

function senderLabel(sender) {
  if (!sender) return "неизвестно";
  const name = [sender.firstName, sender.lastName].filter(Boolean).join(" ");
  if (sender.username) return `${name || sender.username} (@${sender.username})`;
  return name || "без имени";
}

/** Слушаем ли этот чат: по username или по id из TG_WATCH_CHATS. */
function isWatched(chat) {
  if (!WATCH.length) return true;
  const username = chat?.username?.toLowerCase();
  const id = chat?.id ? String(chat.id) : "";
  return WATCH.some((w) => w === username || w === id || `-100${id}` === w);
}

const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
  connectionRetries: 10,
});

/**
 * Финальное решение по находке: показывать её или нет.
 *
 * Словари сказали «похоже»; модель говорит, клиент это или нет — со своим
 * промптом для каждой темы. Если модель недоступна или упала — работаем по
 * словарям, как раньше: сбой AI не должен приводить к потере клиента.
 */
async function judge({ text, chatTitle, source, match, profile }) {
  if (!AI_ENABLED) {
    return { show: match.score >= ALERT_MIN_SCORE, badge: match.badge, ai: null };
  }

  const ai = await classify({ text, chatTitle, source, profile: profile.id });
  if (!ai) {
    stats.aiFailed++;
    return { show: match.score >= ALERT_MIN_SCORE, badge: match.badge, ai: null };
  }

  stats.aiChecked++;
  if (!ai.is_lead || ai.lead_score < AI_MIN_SCORE) {
    stats.aiRejected++;
    return { show: false, badge: temperatureBadge(ai.temperature), ai };
  }

  return { show: true, badge: temperatureBadge(ai.temperature), ai };
}

/** Разбор находки — одинаковый для слушателя и для поиска. */
function verdictLines(verdict, match, profile) {
  if (verdict.ai) {
    return [
      ...formatCard(verdict.ai, escapeHtml, profile.id),
      `\n🤖 ${escapeHtml(verdict.ai.reason)} (${verdict.ai.lead_score}/100)`,
    ];
  }
  return [
    `🔑 Сработало: ${escapeHtml(
      [...match.geo, ...match.topic, ...match.intent].join(", ")
    )}`,
  ];
}

client.addEventHandler(async (event) => {
  try {
    const message = event.message;
    const text = message?.message;
    if (!text || message.out) return; // свои сообщения не анализируем

    // getChat() может вернуть undefined: библиотека не всегда находит чат
    // в кэше сущностей. Раньше на этом месте стоял ранний выход — и радар
    // молча выбрасывал ВСЕ сообщения. Нераспознанное название чата не повод
    // терять клиента: без него просто не сработает гео из заголовка.
    let chat = await (typeof event.getChat === "function"
      ? event.getChat().catch(() => null)
      : Promise.resolve(null));

    // Запасной путь: спросить сущность напрямую по адресату сообщения.
    // Без названия чата теряется гео из заголовка, а вам в уведомлении
    // непонятно, куда идти отвечать.
    if (!chat && message.peerId) {
      chat = await client.getEntity(message.peerId).catch(() => null);
    }

    const chatTitle = chat?.title ?? "";

    // Личные переписки пропускаем: там и так видно, что пишут.
    if (chat?.className === "User") return;
    // Вещание канала — это объявление, а не разговор: отвечать там некому.
    // Отсюда шли отчёты по рынку, реклама вилл и «авто в рассрочку».
    if (chat?.broadcast) return;
    if (isOwnChat(chat)) return; // свои же уведомления не анализируем
    if (!isWatched(chat)) return;

    stats.seen++;

    // Сообщение может подойти сразу двум темам («нужен сайт для агентства
    // недвижимости») — тогда оно уйдёт в оба чата, каждый со своим разбором.
    const hits = PROFILES
      .map((profile) => ({ profile, match: profile.match(text, chatTitle) }))
      .filter((h) => h.match);

    if (!hits.length) return;

    for (const { profile } of hits) {
      matchedByProfile.set(profile.id, (matchedByProfile.get(profile.id) ?? 0) + 1);
    }

    const sender = await resolveSender(event, message);
    // Бот или канал вместо человека: канал подписывает сообщения собой,
    // когда его пост автоматически уезжает в связанный чат обсуждений.
    if (sender?.bot || sender?.className === "Channel") return;

    // Помечаем в любом случае, даже отклонённое: иначе глобальный поиск
    // через полчаса найдёт то же сообщение и оплатит ещё один разбор.
    markSeen(chat?.id ?? message.peerId?.channelId ?? message.peerId?.chatId, message.id);

    const link = messageLink(chat, message);
    const preview = text.length > 700 ? `${text.slice(0, 700)}…` : text;

    for (const { profile, match } of hits) {
      const verdict = await judge({ text, chatTitle, source: "Telegram", match, profile });
      if (!verdict.show) continue;

      if (rateLimited(profile.id)) {
        console.warn(`Лимит уведомлений по теме «${profile.label}» исчерпан`);
        continue;
      }

      await notify(
        profile,
        [
          `${verdict.badge} <b>${profile.alertTitle}</b>`,
          `💬 Чат: ${escapeHtml(chatTitle || "название не определилось")}`,
          `👤 Автор: ${escapeHtml(senderLabel(sender))}`,
          "",
          escapeHtml(preview),
          "",
          ...verdictLines(verdict, match, profile),
          link ? `\n<a href="${link}">Открыть сообщение</a>` : "",
        ]
          .filter(Boolean)
          .join("\n")
      );

      console.log(
        `[${new Date().toLocaleTimeString()}] ${profile.label}: находка в ` +
          `«${chatTitle || "чат без названия"}»`
      );
    }
  } catch (e) {
    console.error("Ошибка обработки сообщения:", e);
  }
}, new NewMessage({}));

await client.connect();

const me = await client.getMe();
console.log(`Lead radar запущен от имени ${me.firstName ?? ""} (@${me.username ?? "—"})`);
console.log(
  WATCH.length
    ? `Слежу за чатами: ${WATCH.join(", ")}`
    : "Слежу за всеми чатами, где вы состоите (сузить: TG_WATCH_CHATS в .env)"
);

for (const p of PROFILES) {
  console.log(
    `Тема «${p.label}» → чат ${p.chatIds.join(", ")}, фраз для поиска: ${p.queries.length}`
  );
}
for (const p of DISABLED_PROFILES) {
  console.log(`Тема «${p.label}» выключена: не задан отдельный чат для находок`);
}

const dialogs = await client.getDialogs({ limit: 200 });
const chatCount = dialogs.filter((d) => d.isGroup || d.isChannel).length;
console.log(`Чатов и каналов у аккаунта: ${chatCount}`);
console.log(
  AI_ENABLED
    ? `AI-классификатор включён, порог ${AI_MIN_SCORE}/100`
    : "AI-классификатор выключен (нет ANTHROPIC_API_KEY) — работают только словари"
);

setInterval(async () => {
  const perProfile = PROFILES
    .map((p) => `${p.label} ${matchedByProfile.get(p.id) ?? 0}`)
    .join(", ");
  console.log(
    `[${new Date().toLocaleTimeString()}] за ${STATS_INTERVAL_MIN} мин: ` +
      `просмотрено ${stats.seen}, совпало — ${perProfile}` +
      (AI_ENABLED
        ? `, разобрано AI ${stats.aiChecked}, отсеяно ${stats.aiRejected}` +
          (stats.aiFailed ? `, сбоев AI ${stats.aiFailed}` : "")
        : "")
  );

  if (stats.seen === 0) {
    silentIntervals++;
    if (silentIntervals >= SILENT_INTERVALS_TO_ALARM && !alarmSent) {
      alarmSent = true;
      await notifyAll(
        `🔴 <b>Радар не видит сообщений</b>\n` +
          `Уже ${silentIntervals * STATS_INTERVAL_MIN} минут подряд — ни одного сообщения ` +
          `из ${chatCount} чатов.\n\nЛибо чаты действительно молчат, либо радар ослеп. ` +
          `Проверьте: <code>pm2 restart lead-radar</code>`
      );
    }
  } else {
    if (alarmSent) {
      await notifyAll("🟢 Радар снова видит сообщения — поток восстановился.");
    }
    silentIntervals = 0;
    alarmSent = false;
  }

  stats.seen = 0;
  stats.aiChecked = 0;
  stats.aiRejected = 0;
  stats.aiFailed = 0;
  for (const p of PROFILES) matchedByProfile.set(p.id, 0);
}, STATS_INTERVAL_MIN * 60_000);

// --- Глобальный поиск по публичным чатам ---
// Слушатель выше работает только по чатам, куда вы вступили. Этот цикл ищет
// по всей публичной части Telegram, поэтому находит людей в чатах, о которых
// вы даже не знаете. Для разработки это основной источник: в чатах про
// недвижимость заказы на сайты почти не встречаются.
// Выключается через GLOBAL_SEARCH_MIN=0.
const GLOBAL_SEARCH_MIN = Number(process.env.GLOBAL_SEARCH_MIN ?? 25);

async function globalSearchTick() {
  try {
    const { findings, scanned, batch } = await runGlobalSearch(client, PROFILES);
    console.log(
      `[${new Date().toLocaleTimeString()}] поиск (${batch.join(" · ")}): ` +
        `новых сообщений ${scanned}, подходящих ${findings.length}`
    );

    for (const f of findings) {
      const verdict = await judge({
        text: f.text,
        chatTitle: f.title,
        source: "Telegram (поиск)",
        match: f.match,
        profile: f.profile,
      });
      if (!verdict.show) continue;

      if (rateLimited(f.profile.id)) {
        console.warn(`Лимит по теме «${f.profile.label}» исчерпан — находка пропущена`);
        continue;
      }
      const preview = f.text.length > 700 ? `${f.text.slice(0, 700)}…` : f.text;
      await notify(
        f.profile,
        [
          `🌍 ${verdict.badge} <b>${f.profile.alertTitle} — найдено поиском</b>`,
          `💬 Чат: ${escapeHtml(f.title || "без названия")}`,
          `🔎 По запросу: ${escapeHtml(f.query)}`,
          "",
          escapeHtml(preview),
          "",
          ...verdictLines(verdict, f.match, f.profile),
          f.link ? `\n<a href="${f.link}">Открыть сообщение</a>` : "",
        ]
          .filter(Boolean)
          .join("\n")
      );
    }
  } catch (e) {
    console.error("Ошибка глобального поиска:", e?.message ?? e);
  }
}

if (GLOBAL_SEARCH_MIN > 0) {
  await loadSeen();
  const queue = buildQueue(PROFILES);
  console.log(
    `Глобальный поиск включён: ${queue.length} фраз по ${PROFILES.length} темам, ` +
      `заход каждые ${GLOBAL_SEARCH_MIN} мин`
  );
  // Первый заход с задержкой: на старте клиент ещё разбирается с соединением.
  setTimeout(globalSearchTick, 60_000);
  setInterval(globalSearchTick, GLOBAL_SEARCH_MIN * 60_000);
}

// Каждая тема здоровается в своём чате: сразу видно, что канал подключён
// правильно и находки пойдут именно туда.
for (const profile of PROFILES) {
  await notify(
    profile,
    `🟢 Lead radar запущен. Тема: <b>${profile.label}</b>. Слушает ${chatCount} чатов.`
  );
}
