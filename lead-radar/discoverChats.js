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
import { TelegramClient, Api } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";

const apiId = Number(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH;
const session = process.env.TG_SESSION;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

/** Что ищем. Города и формулировки, по которым люди называют свои чаты. */
const QUERIES = [
  // Инвестиционные и покупательские чаты — там аудитория с деньгами.
  // Общегородские чаты («Ереван чат») сюда намеренно не включены: там
  // спрашивают, где поесть и как снять за 500$, а не где купить за 400к.
  "инвестиции в недвижимость",
  "недвижимость Дубай инвестиции",
  "Dubai real estate",
  "Дубай инвестиции",
  "купить недвижимость Дубай",
  "недвижимость ОАЭ",
  "золотая виза ОАЭ",
  "недвижимость Грузия инвестиции",
  "Батуми недвижимость",
  "Тбилиси недвижимость купить",
  "Ереван недвижимость купить",
  "ВНЖ через недвижимость",
  "зарубежная недвижимость",
  "релокация бизнеса",
  "налоговое резидентство",
];

/** Мелкие чаты не окупают шум: ниже этого порога не показываем. */
const MIN_PARTICIPANTS = Number(process.env.DISCOVER_MIN_MEMBERS ?? 300);

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

for (const q of QUERIES) {
  try {
    const res = await client.invoke(
      new Api.contacts.Search({ q, limit: 30 })
    );

    for (const chat of res.chats ?? []) {
      const id = String(chat.id);
      if (joined.has(id) || found.has(id)) continue;
      // Каналы-вещалки не нужны: там не спрашивают, там только читают.
      if (chat.broadcast) continue;

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
    const wait = /FLOOD_WAIT_(\d+)/.exec(e?.message ?? "");
    if (wait) {
      console.warn(`FLOOD_WAIT ${wait[1]} сек — останавливаюсь`);
      break;
    }
    console.error(`Ошибка поиска «${q}»:`, e?.message ?? e);
  }

  await sleep(3000);
}

const list = [...found.values()].sort((a, b) => b.members - a.members);
console.log(`Найдено кандидатов: ${list.length}`);

if (!list.length) {
  await notify("🔍 Поиск чатов: подходящих кандидатов не нашлось.");
} else {
  // Режем на части: в одно сообщение Telegram пускает 4096 символов.
  const lines = list.map(
    (c) =>
      `· <b>${escapeHtml(c.title)}</b> — ${c.members.toLocaleString("ru-RU")} участников` +
      (c.username ? `\n  https://t.me/${c.username}` : " (закрытый, ссылки нет)")
  );

  await notify(
    `🔍 <b>Чаты, куда стоит вступить</b>\nНайдено ${list.length} штук, ` +
      `отсортированы по числу участников.\n\nВступайте вручную: часть окажется ` +
      `мёртвой или мусорной, это видно только глазами.`
  );

  for (let i = 0; i < lines.length; i += 15) {
    await notify(lines.slice(i, i + 15).join("\n\n"));
    await sleep(1200);
  }
}

await client.disconnect();
process.exit(0);
