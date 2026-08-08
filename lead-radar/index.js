// Lead radar — слушает Telegram-чаты, в которых вы состоите, и присылает
// вам в личку сообщения, похожие на запрос покупателя недвижимости.
//
// Что он делает: читает поток новых сообщений вашим же аккаунтом (как если бы
// вы сами листали чаты), фильтрует по словарям из keywords.js и пересылает
// подходящее вашему боту со ссылкой на оригинал.
//
// Чего он НЕ делает и делать не должен: не пишет никому автоматически.
// Отвечает человек, руками, по правилам конкретного чата. Автоответы и
// рассылки в личку — прямой путь к бану аккаунта и к тому, что администраторы
// закроют вам вход в лучшие чаты релокантов. Инструмент экономит время на
// поиске, а не заменяет разговор.

import "dotenv/config";
// teleproto — поддерживаемый форк GramJS: сам GramJS (пакет telegram) заархивирован.
import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";
import { NewMessage } from "teleproto/events/index.js";
import { matchLead } from "./keywords.js";
import { loadSeen, runGlobalSearch, QUERIES } from "./globalSearch.js";

const apiId = Number(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH;
const session = process.env.TG_SESSION;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// Пустой список = слушаем все чаты, где вы состоите.
const WATCH = (process.env.TG_WATCH_CHATS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Не больше N уведомлений в минуту: если словари настроены слишком широко,
// лучше упереться в потолок, чем получить 500 сообщений и всё выключить.
const MAX_ALERTS_PER_MINUTE = Number(process.env.MAX_ALERTS_PER_MINUTE ?? 12);

if (!apiId || !apiHash || !session) {
  console.error(
    "Не заданы TG_API_ID / TG_API_HASH / TG_SESSION.\n" +
      "Получите api_id и api_hash на https://my.telegram.org → API development tools,\n" +
      "затем выполните: npm run login"
  );
  process.exit(1);
}

if (!botToken || !chatId) {
  console.error(
    "Не заданы TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID — некуда присылать находки.\n" +
      "Возьмите те же значения, что и для сайта (.env.local)."
  );
  process.exit(1);
}

// Раз в полчаса пишем в лог, сколько сообщений просмотрено и сколько совпало.
// Без этого «ноль находок» невозможно отличить от «радар отвалился и молчит» —
// а это две совершенно разные ситуации с разными действиями.
const STATS_INTERVAL_MIN = Number(process.env.STATS_INTERVAL_MIN ?? 30);
const stats = { seen: 0, matched: 0 };

// Сколько интервалов подряд без единого сообщения считать поломкой.
// Ровно эта ситуация уже случалась: процесс «online», а сообщений не видит.
// Молчание радара неотличимо от затишья в чатах, поэтому он должен
// сам сказать, что ослеп, — иначе вы неделю ждёте лидов от мёртвого инструмента.
const SILENT_INTERVALS_TO_ALARM = 3;
let silentIntervals = 0;
let alarmSent = false;

const alertTimestamps = [];

function rateLimited() {
  const now = Date.now();
  while (alertTimestamps.length && now - alertTimestamps[0] > 60_000) {
    alertTimestamps.shift();
  }
  if (alertTimestamps.length >= MAX_ALERTS_PER_MINUTE) return true;
  alertTimestamps.push(now);
  return false;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function notify(text, attempt = 0) {
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
    return notify(text, attempt + 1);
  }
  console.error("Telegram API:", body);
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

// Куда радар сам пишет. Читать эти чаты нельзя: собственные уведомления
// содержат и город, и слово «квартира», и вопрос — радар находил сам себя
// и заводился по кругу.
const OWN_CHATS = new Set(
  String(chatId)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .flatMap((id) => [id, id.replace("-100", ""), id.replace(/^-/, "")])
);

function isOwnChat(chat) {
  if (!chat?.id) return false;
  const id = String(chat.id);
  return OWN_CHATS.has(id) || OWN_CHATS.has(`-${id}`) || OWN_CHATS.has(`-100${id}`);
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
    if (isOwnChat(chat)) return; // свои же уведомления не анализируем
    if (!isWatched(chat)) return;

    stats.seen++;

    const match = matchLead(text, chatTitle);
    if (!match) return;

    stats.matched++;

    const sender = await resolveSender(event, message);
    if (sender?.bot) return;

    if (rateLimited()) {
      console.warn("Лимит уведомлений исчерпан — сообщение пропущено");
      return;
    }

    const link = messageLink(chat, message);
    const preview = text.length > 700 ? `${text.slice(0, 700)}…` : text;

    await notify(
      [
        `${match.badge} <b>Похоже на клиента</b>`,
        `💬 Чат: ${escapeHtml(chatTitle || "название не определилось")}`,
        `👤 Автор: ${escapeHtml(senderLabel(sender))}`,
        "",
        escapeHtml(preview),
        "",
        `🔑 Сработало: ${escapeHtml(
          [...match.geo, ...match.topic, ...match.intent].join(", ")
        )}`,
        link ? `\n<a href="${link}">Открыть сообщение</a>` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );

    console.log(
      `[${new Date().toLocaleTimeString()}] находка в «${chatTitle || "чат без названия"}»`
    );
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

const dialogs = await client.getDialogs({ limit: 200 });
const chatCount = dialogs.filter((d) => d.isGroup || d.isChannel).length;
console.log(`Чатов и каналов у аккаунта: ${chatCount}`);

setInterval(async () => {
  console.log(
    `[${new Date().toLocaleTimeString()}] за ${STATS_INTERVAL_MIN} мин: ` +
      `просмотрено ${stats.seen}, совпало ${stats.matched}`
  );

  if (stats.seen === 0) {
    silentIntervals++;
    if (silentIntervals >= SILENT_INTERVALS_TO_ALARM && !alarmSent) {
      alarmSent = true;
      await notify(
        `🔴 <b>Радар не видит сообщений</b>\n` +
          `Уже ${silentIntervals * STATS_INTERVAL_MIN} минут подряд — ни одного сообщения ` +
          `из ${chatCount} чатов.\n\nЛибо чаты действительно молчат, либо радар ослеп. ` +
          `Проверьте: <code>pm2 restart lead-radar</code>`
      );
    }
  } else {
    if (alarmSent) {
      await notify("🟢 Радар снова видит сообщения — поток восстановился.");
    }
    silentIntervals = 0;
    alarmSent = false;
  }

  stats.seen = 0;
  stats.matched = 0;
}, STATS_INTERVAL_MIN * 60_000);

// --- Глобальный поиск по публичным чатам ---
// Слушатель выше работает только по чатам, куда вы вступили. Этот цикл ищет
// по всей публичной части Telegram, поэтому находит людей в чатах, о которых
// вы даже не знаете. Выключается через GLOBAL_SEARCH_MIN=0.
const GLOBAL_SEARCH_MIN = Number(process.env.GLOBAL_SEARCH_MIN ?? 25);

async function globalSearchTick() {
  try {
    const { findings, scanned, batch } = await runGlobalSearch(client);
    console.log(
      `[${new Date().toLocaleTimeString()}] поиск (${batch.join(" · ")}): ` +
        `новых сообщений ${scanned}, подходящих ${findings.length}`
    );

    for (const f of findings) {
      if (rateLimited()) {
        console.warn("Лимит уведомлений исчерпан — находка поиска пропущена");
        break;
      }
      const preview = f.text.length > 700 ? `${f.text.slice(0, 700)}…` : f.text;
      await notify(
        [
          "🌍 <b>Найдено поиском по Telegram</b>",
          `💬 Чат: ${escapeHtml(f.title || "без названия")}`,
          `🔎 По запросу: ${escapeHtml(f.query)}`,
          "",
          escapeHtml(preview),
          "",
          `🔑 Сработало: ${escapeHtml(
            [...f.match.geo, ...f.match.topic, ...f.match.intent].join(", ")
          )}`,
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
  console.log(
    `Глобальный поиск включён: ${QUERIES.length} фраз, заход каждые ${GLOBAL_SEARCH_MIN} мин`
  );
  // Первый заход с задержкой: на старте клиент ещё разбирается с соединением.
  setTimeout(globalSearchTick, 60_000);
  setInterval(globalSearchTick, GLOBAL_SEARCH_MIN * 60_000);
}

await notify(
  `🟢 Lead radar запущен и слушает ${chatCount} чатов.`
);
