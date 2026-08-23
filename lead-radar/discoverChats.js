// Поиск чатов, в которые стоит вступить.
//
// Узкое место радара — не фильтр, а охват: он слышит только те чаты, где вы
// состоите. Искать их руками через поиск Telegram долго и наугад. Этот скрипт
// прогоняет список запросов через поиск Telegram, отбрасывает то, где вы уже
// есть, и присылает список кандидатов с числом участников.
//
// Вступать он ничего не вступает — решение за вами: в половине найденного
// будут мёртвые или мусорные чаты, это видно только глазами.
//
// Запускать: npm run discover (радар лучше остановить: pm2 stop lead-radar)

import "dotenv/config";
import { writeFile } from "fs/promises";
import path from "path";
import { TelegramClient, Api } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";

const apiId = Number(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH;
const session = process.env.TG_SESSION;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

/**
 * Что ищем.
 *
 * Раньше здесь намеренно не было общегородских чатов вроде «Ереван чат»:
 * они состоят из «где поесть» и «сниму за 500$». Это было верно, пока фильтр
 * протекал на аренде. Теперь аренда отсекается словарями и порогом суммы,
 * так что общие чаты релокантов снова имеют смысл: покупатель сидит именно
 * там, просто говорит о покупке раз в неделю, а не каждым сообщением.
 */
const QUERIES = [
  // --- ОАЭ ---
  "Дубай чат",
  "русские в Дубае",
  "ОАЭ чат",
  "Дубай инвестиции",
  "недвижимость Дубай",
  "новостройки Дубай",
  "золотая виза ОАЭ",
  "переезд в Дубай",
  "релокация ОАЭ",
  "бизнес в ОАЭ",
  "налоги ОАЭ",
  "Dubai chat",
  "Dubai real estate",
  "Dubai off plan",
  "Emaar",
  "DAMAC",
  "Dubai Marina",
  "Business Bay",

  // --- Армения ---
  "Ереван чат",
  "русские в Армении",
  "Армения релокация",
  "Ереван недвижимость",
  "ВНЖ Армения",
  "переезд в Армению",
  "бизнес в Армении",
  "Ереван квартиры",
  "Армения инвестиции",

  // --- Грузия ---
  "Тбилиси чат",
  "Батуми чат",
  "русские в Грузии",
  "Грузия релокация",
  "ВНЖ Грузия",
  "Батуми недвижимость",
  "Тбилиси недвижимость",
  "Грузия инвестиции",
  "переезд в Грузию",
  "Батуми инвестиции",
  "Батуми апартаменты",

  // --- Россия ---
  "новостройки Сочи",
  "недвижимость Сочи",
  "Краснодар новостройки",
  "инвестиции в новостройки",
  "новостройки Москва чат",

  // --- Инвестиции и релокация вообще ---
  "зарубежная недвижимость",
  "инвестиции в недвижимость",
  "недвижимость за рубежом",
  "второй паспорт",
  "релокация бизнеса",
  "налоговое резидентство",
  "куда инвестировать",
  "покупка квартиры за рубежом",
  "инвестиции в недвижимость чат",
  "недвижимость обсуждение",
];

/** Мелкие чаты не окупают шум: ниже этого порога не показываем. */
const MIN_PARTICIPANTS = Number(process.env.DISCOVER_MIN_MEMBERS ?? 150);

/**
 * Сколько последних сообщений прочитать, чтобы понять, живой это чат или
 * витрина объявлений. По названию их не различить: «Недвижимость Дубая»
 * может быть и лентой агентских постов, и чатом, где спрашивают совета.
 * Разница видна только в том, КТО и КАК там пишет.
 */
const PROBE_MESSAGES = 60;
/** Витрина — это два-три автора подряд. Живой чат — десятки. */
const MIN_UNIQUE_SENDERS = 8;
/** Доля сообщений с вопросом. Где не спрашивают — там нечего ловить. */
const MIN_QUESTION_SHARE = 0.1;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function notify(text) {
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
  if (!res.ok) console.error("Telegram API:", await res.text());
}

const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
  connectionRetries: 5,
});

await client.connect();
await client.getMe();

// Куда вы уже вступили — чтобы не предлагать это же ещё раз.
const dialogs = await client.getDialogs({ limit: 200 });
const joined = new Set(
  dialogs.filter((d) => d.isGroup || d.isChannel).map((d) => String(d.id))
);
console.log(`Уже состоите в ${joined.size} чатах, ищу новые...`);

const found = new Map();

/**
 * Чат обсуждений, привязанный к каналу. Telegram отдаёт его только в полной
 * карточке канала, поэтому за каждым приходится ходить отдельным запросом.
 */
async function linkedChat(channel) {
  try {
    const full = await client.invoke(
      new Api.channels.GetFullChannel({ channel })
    );
    const linkedId = full.fullChat?.linkedChatId;
    await sleep(1200); // отдельный вызов API — не частим
    if (!linkedId) return null;
    return (full.chats ?? []).find((c) => String(c.id) === String(linkedId)) ?? null;
  } catch {
    // У закрытых каналов полную карточку не отдают — это не повод падать.
    return null;
  }
}

for (const q of QUERIES) {
  try {
    const res = await client.invoke(
      new Api.contacts.Search({ q, limit: 30 })
    );

    for (const chat of res.chats ?? []) {
      const id = String(chat.id);
      if (joined.has(id) || found.has(id)) continue;

      // Сам канал читать бесполезно — там вещают. Но у канала бывает
      // связанный чат обсуждений, и вот он-то и нужен: там сидят читатели
      // канала про новостройки и задают ровно те вопросы, которые мы ищем.
      // Поиском Telegram такие чаты не находятся — только через сам канал.
      if (chat.broadcast) {
        const linked = await linkedChat(chat);
        if (!linked) continue;
        const linkedId = String(linked.id);
        if (joined.has(linkedId) || found.has(linkedId)) continue;
        found.set(linkedId, {
          title: linked.title ?? `обсуждение «${chat.title ?? ""}»`,
          username: linked.username,
          members: linked.participantsCount ?? 0,
          query: `${q} → обсуждение канала`,
        });
        continue;
      }

      const members = chat.participantsCount ?? 0;
      if (members < MIN_PARTICIPANTS) continue;

      found.set(id, {
        title: chat.title ?? "без названия",
        username: chat.username,
        members,
        query: q,
      });
    }
  } catch (e) {
    const wait = Number(/FLOOD_WAIT_(\d+)/.exec(e?.message ?? "")?.[1] ?? 0);
    if (wait > 0 && wait <= 60) {
      console.warn(`FLOOD_WAIT ${wait} сек на «${q}» — жду и иду дальше`);
      await sleep((wait + 2) * 1000);
    } else if (wait > 60) {
      console.warn(`FLOOD_WAIT ${wait} сек — слишком долго, прекращаю поиск`);
      break;
    } else {
      console.error(`Ошибка поиска «${q}»:`, e?.message ?? e);
    }
  }

  await sleep(3000);
}

const candidates = [...found.values()].sort((a, b) => b.members - a.members);
console.log(`Кандидатов до проверки: ${candidates.length}, читаю по ${PROBE_MESSAGES} сообщений...`);

/**
 * Заглядываем в чат и считаем признаки жизни. Читать публичные чаты можно
 * без вступления — как и любой человек через поиск.
 */
async function probe(entity) {
  const senders = new Set();
  let total = 0;
  let questions = 0;
  let oldest = null;
  let newest = null;

  for await (const m of client.iterMessages(entity, { limit: PROBE_MESSAGES })) {
    const t = m.message;
    if (!t) continue;
    total++;
    if (t.includes("?")) questions++;
    if (m.senderId) senders.add(String(m.senderId));
    if (m.date) {
      newest ??= m.date;
      oldest = m.date;
    }
  }

  if (!total) return null;
  const days = Math.max((newest - oldest) / 86400, 0.05);
  return {
    total,
    uniqueSenders: senders.size,
    questionShare: questions / total,
    perDay: Math.round(total / days),
  };
}

const list = [];
for (const c of candidates.slice(0, 80)) {
  if (!c.username) continue; // закрытый чат не прочитать, не вступив
  try {
    const entity = await client.getEntity(c.username);
    const stats = await probe(entity);
    if (!stats) continue;

    // Витрина: пишут единицы и никто ничего не спрашивает.
    const alive =
      stats.uniqueSenders >= MIN_UNIQUE_SENDERS &&
      stats.questionShare >= MIN_QUESTION_SHARE;

    console.log(
      `  ${alive ? "живой " : "витрина"} ${c.title.slice(0, 40)} — ` +
        `авторов ${stats.uniqueSenders}, вопросов ${Math.round(stats.questionShare * 100)}%, ` +
        `${stats.perDay} сообщ/день`
    );

    if (alive) list.push({ ...c, ...stats });
  } catch (e) {
    const wait = Number(/FLOOD_WAIT_(\d+)/.exec(e?.message ?? "")?.[1] ?? 0);
    if (wait > 0 && wait <= 60) {
      console.warn(`FLOOD_WAIT ${wait} сек — жду и продолжаю проверку`);
      await sleep((wait + 2) * 1000);
    } else if (wait > 60) {
      console.warn(`FLOOD_WAIT ${wait} сек — прекращаю проверку`);
      break;
    }
  }
  await sleep(2500);
}

// Сортируем по живости, а не по числу участников: чат на 2000 человек,
// где пишут пятеро, бесполезнее чата на 500, где спорят каждый день.
list.sort((a, b) => b.uniqueSenders * b.perDay - a.uniqueSenders * a.perDay);
console.log(`Живых чатов: ${list.length}`);

// В Telegram список уходит порезанным на сообщения по 4096 символов,
// а файл можно перечитать целиком и сравнить с прошлым заходом.
await writeFile(
  path.join(process.cwd(), "discovered-chats.json"),
  JSON.stringify({ at: new Date().toISOString(), list }, null, 2),
  "utf8"
);
console.log("Список сохранён в discovered-chats.json");

if (!list.length) {
  await notify(
    "🔍 <b>Поиск чатов</b>\nЖивых чатов не нашлось: всё, что попалось, — " +
      "витрины объявлений, где пишут два-три агента и никто ничего не спрашивает."
  );
} else {
  // Режем на части: в одно сообщение Telegram пускает 4096 символов.
  const lines = list.map(
    (c) =>
      `· <b>${escapeHtml(c.title)}</b>\n` +
      `  ${c.members.toLocaleString("ru-RU")} участников · ${c.uniqueSenders} авторов ` +
      `· ${Math.round(c.questionShare * 100)}% вопросов · ~${c.perDay} сообщ/день\n` +
      `  https://t.me/${c.username}`
  );

  await notify(
    `🔍 <b>Живые чаты, куда стоит вступить</b>\nНайдено ${list.length}. ` +
      `Витрины объявлений отсеяны: в них пишут два-три агента и никто не спрашивает.\n\n` +
      `Смотрите на «авторов» и «вопросов» — это и есть признак того, что там разговаривают.`
  );

  for (let i = 0; i < lines.length; i += 15) {
    await notify(lines.slice(i, i + 15).join("\n\n"));
    await sleep(1200);
  }
}

await client.disconnect();
process.exit(0);
