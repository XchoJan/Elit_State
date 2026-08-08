// Глобальный поиск по публичным чатам Telegram.
//
// Слушатель из index.js слышит только те чаты, куда вы вступили. Этот модуль
// снимает ограничение: он ищет по всем публичным сообщениям сети — так же,
// как поиск в самом приложении, только по расписанию и с разбором результатов.
//
// Осторожность здесь не декоративная. Частые поисковые запросы Telegram
// считает подозрительными и отвечает FLOOD_WAIT, а при упорстве может
// ограничить аккаунт. Поэтому: небольшой список фраз, ротация по несколько
// штук за раз, паузы между запросами и уважение к FLOOD_WAIT.

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { Api } from "teleproto";
import { matchLead } from "./keywords.js";

/**
 * Фразы для поиска. Короткие и конкретные работают лучше длинных:
 * Telegram ищет по вхождению слов, а не по смыслу.
 */
export const QUERIES = [
  "купить квартиру в Дубае",
  "недвижимость в Дубае",
  "квартира в Дубае",
  "купить квартиру в Ереване",
  "недвижимость в Ереване",
  "купить квартиру в Батуми",
  "квартира в Тбилиси",
  "недвижимость в Грузии",
  "инвестиции в недвижимость Дубай",
  "ВНЖ Грузия недвижимость",
];

/** Сколько фраз прогонять за один заход — остальные подождут следующего. */
const QUERIES_PER_RUN = 3;
/** Пауза между запросами внутри одного захода, мс. */
const PAUSE_BETWEEN_QUERIES = 8000;
/** Сколько результатов запрашивать на фразу. */
const LIMIT = 20;
/** Насколько старые сообщения ещё интересны. */
const LOOKBACK_DAYS = 3;

const SEEN_FILE = path.join(process.cwd(), "seen-global.json");
/** Больше не храним: файл читается целиком, а старые id всё равно не нужны. */
const SEEN_LIMIT = 5000;

let queryOffset = 0;
let seen = new Set();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function loadSeen() {
  try {
    seen = new Set(JSON.parse(await readFile(SEEN_FILE, "utf8")));
  } catch {
    seen = new Set(); // первый запуск — файла ещё нет
  }
}

async function saveSeen() {
  try {
    const list = [...seen].slice(-SEEN_LIMIT);
    seen = new Set(list);
    await writeFile(SEEN_FILE, JSON.stringify(list), "utf8");
  } catch (e) {
    console.error("Не удалось сохранить список показанных сообщений:", e);
  }
}

/** Название и ссылка на чат по peerId сообщения — из справочника в ответе. */
function describeChat(message, chats) {
  const channelId = message.peerId?.channelId ?? message.peerId?.chatId;
  if (!channelId) return { title: "", link: null };

  const chat = chats.find((c) => String(c.id) === String(channelId));
  const title = chat?.title ?? "";
  const link = chat?.username
    ? `https://t.me/${chat.username}/${message.id}`
    : `https://t.me/c/${String(channelId)}/${message.id}`;

  return { title, link };
}

/**
 * Прогоняет очередную порцию фраз. Возвращает находки — отправкой занимается
 * вызывающий код, чтобы вся работа с Telegram-ботом жила в одном месте.
 */
export async function runGlobalSearch(client) {
  const minDate = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 86400;
  const findings = [];
  let scanned = 0;

  // Ротация: за раз берём несколько фраз, следующий заход продолжит со следующей.
  const batch = [];
  for (let i = 0; i < QUERIES_PER_RUN; i++) {
    batch.push(QUERIES[(queryOffset + i) % QUERIES.length]);
  }
  queryOffset = (queryOffset + QUERIES_PER_RUN) % QUERIES.length;

  for (const q of batch) {
    try {
      const res = await client.invoke(
        new Api.messages.SearchGlobal({
          q,
          filter: new Api.InputMessagesFilterEmpty({}),
          minDate,
          maxDate: 0,
          offsetRate: 0,
          offsetPeer: new Api.InputPeerEmpty({}),
          offsetId: 0,
          limit: LIMIT,
        })
      );

      const chats = res.chats ?? [];
      for (const message of res.messages ?? []) {
        const text = message.message;
        if (!text || message.out) continue;

        const { title, link } = describeChat(message, chats);
        const key = `${title || "?"}:${message.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        scanned++;
        const match = matchLead(text, title);
        if (match) findings.push({ text, title, link, match, query: q });
      }
    } catch (e) {
      const wait = /FLOOD_WAIT_(\d+)/.exec(e?.message ?? "");
      if (wait) {
        // Telegram просит подождать — спорить бессмысленно и вредно для аккаунта.
        console.warn(`Поиск «${q}»: FLOOD_WAIT ${wait[1]} сек, пропускаю заход`);
        break;
      }
      console.error(`Ошибка поиска «${q}»:`, e?.message ?? e);
    }

    await sleep(PAUSE_BETWEEN_QUERIES);
  }

  await saveSeen();
  return { findings, scanned, batch };
}
