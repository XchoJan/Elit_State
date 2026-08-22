// Глобальный поиск по публичным чатам Telegram.
//
// Слушатель из index.js слышит только те чаты, куда вы вступили. Этот модуль
// снимает ограничение: он ищет по всем публичным сообщениям сети — так же,
// как поиск в самом приложении, только по расписанию и с разбором результатов.
//
// Для второй темы это вообще главный источник: заказы на разработку в чатах
// про недвижимость почти не встречаются, а по всей публичной сети — сколько
// угодно.
//
// Осторожность здесь не декоративная. Частые поисковые запросы Telegram
// считает подозрительными и отвечает FLOOD_WAIT, а при упорстве может
// ограничить аккаунт. Поэтому: небольшой список фраз, ротация по несколько
// штук за раз, паузы между запросами и уважение к FLOOD_WAIT.

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { Api } from "teleproto";
import { isOwnChat } from "./profiles.js";

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

/**
 * Общая очередь фраз, где темы чередуются: estate, dev, estate, dev…
 *
 * Если просто склеить списки, то при трёх фразах за заход первые часы уходили
 * бы только на недвижимость, а разработка ждала бы своей очереди полдня.
 */
export function buildQueue(profiles) {
  const queue = [];
  const longest = Math.max(...profiles.map((p) => p.queries.length), 0);
  for (let i = 0; i < longest; i++) {
    for (const profile of profiles) {
      if (i < profile.queries.length) queue.push({ profile, query: profile.queries[i] });
    }
  }
  return queue;
}

export async function loadSeen() {
  try {
    seen = new Set(JSON.parse(await readFile(SEEN_FILE, "utf8")));
  } catch {
    seen = new Set(); // первый запуск — файла ещё нет
  }
}

/**
 * Отметить сообщение как уже показанное. Вызывает слушатель: иначе поиск
 * через полчаса найдёт то же самое и пришлёт второй раз.
 */
export function markSeen(chatId, messageId) {
  if (!chatId || !messageId) return;
  seen.add(`${String(chatId).replace("-100", "").replace(/^-/, "")}:${messageId}`);
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

/** Название, ссылка и id чата по peerId сообщения — из справочника в ответе. */
function describeChat(message, chats) {
  const channelId = message.peerId?.channelId ?? message.peerId?.chatId;
  if (!channelId) return { title: "", link: null, id: "", broadcast: false };

  const id = String(channelId);
  const chat = chats.find((c) => String(c.id) === id);
  const title = chat?.title ?? "";
  const link = chat?.username
    ? `https://t.me/${chat.username}/${message.id}`
    : `https://t.me/c/${id}/${message.id}`;

  // broadcast — канал, а не группа: там объявление, а не человек с запросом.
  return { title, link, id, broadcast: Boolean(chat?.broadcast) };
}

/**
 * Прогоняет очередную порцию фраз. Возвращает находки — отправкой занимается
 * вызывающий код, чтобы вся работа с Telegram-ботом жила в одном месте.
 *
 * Сообщение разбирается словарями того профиля, чьей фразой его нашли:
 * запрос «ищу разработчика» ищет заказчика, а не покупателя квартиры.
 */
export async function runGlobalSearch(client, profiles) {
  const queue = buildQueue(profiles);
  if (!queue.length) return { findings: [], scanned: 0, batch: [] };

  const minDate = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 86400;
  const findings = [];
  let scanned = 0;

  // Ротация: за раз берём несколько фраз, следующий заход продолжит со следующей.
  const batch = [];
  for (let i = 0; i < Math.min(QUERIES_PER_RUN, queue.length); i++) {
    batch.push(queue[(queryOffset + i) % queue.length]);
  }
  queryOffset = (queryOffset + batch.length) % queue.length;

  for (const { profile, query } of batch) {
    try {
      const res = await client.invoke(
        new Api.messages.SearchGlobal({
          q: query,
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

        const { title, link, id, broadcast } = describeChat(message, chats);
        if (isOwnChat(id)) continue; // свои же уведомления не ищем
        if (broadcast) continue; // вещание канала — отвечать некому

        // Ключ по id чата, а не по названию: название определяется не всегда,
        // и одно и то же сообщение приходило по нескольку раз.
        const key = `${id}:${message.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        scanned++;
        const match = profile.match(text, title);
        if (match) findings.push({ text, title, link, match, query, profile });
      }
    } catch (e) {
      const wait = /FLOOD_WAIT_(\d+)/.exec(e?.message ?? "");
      if (wait) {
        // Telegram просит подождать — спорить бессмысленно и вредно для аккаунта.
        console.warn(`Поиск «${query}»: FLOOD_WAIT ${wait[1]} сек, пропускаю заход`);
        break;
      }
      console.error(`Ошибка поиска «${query}»:`, e?.message ?? e);
    }

    await sleep(PAUSE_BETWEEN_QUERIES);
  }

  await saveSeen();
  return { findings, scanned, batch: batch.map((b) => b.query) };
}
