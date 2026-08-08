// Разбор истории чатов — разовый прогон.
//
// Слушатель ловит только то, что написали после его запуска. Но человек,
// спросивший «кто покупал в Батуми» три дня назад, всё ещё ищет — просто
// мы его не слышали. Этот скрипт проходит по истории всех чатов, где вы
// состоите, и достаёт такие сообщения задним числом.
//
// Запускать: npm run backfill
// Радар при этом нужно остановить (pm2 stop lead-radar) — две копии на одной
// сессии Telegram мешают друг другу.

import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";
import { matchLead } from "./keywords.js";

const apiId = Number(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH;
const session = process.env.TG_SESSION;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

/** За сколько дней назад смотреть. Дальше — люди уже купили или передумали. */
const DAYS = Number(process.env.BACKFILL_DAYS ?? 14);
/** Сколько сообщений максимум читать в одном чате. */
const PER_CHAT_LIMIT = Number(process.env.BACKFILL_PER_CHAT ?? 3000);
/** Потолок находок: больше полусотни за раз всё равно никто не разберёт. */
const MAX_FINDINGS = Number(process.env.BACKFILL_MAX ?? 40);

const SEEN_FILE = path.join(process.cwd(), "seen-global.json");

if (!apiId || !apiHash || !session || !botToken || !chatId) {
  console.error("Не заполнен lead-radar/.env — нечем подключаться.");
  process.exit(1);
}

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

async function loadSeen() {
  try {
    return new Set(JSON.parse(await readFile(SEEN_FILE, "utf8")));
  } catch {
    return new Set();
  }
}

const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
  connectionRetries: 5,
});

await client.connect();
const me = await client.getMe();
console.log(`Разбор истории от имени @${me.username ?? "—"}, глубина ${DAYS} дней`);

const cutoff = Math.floor(Date.now() / 1000) - DAYS * 86400;
const seen = await loadSeen();

const dialogs = await client.getDialogs({ limit: 200 });
const chats = dialogs.filter((d) => d.isGroup || d.isChannel);
console.log(`Чатов к разбору: ${chats.length}`);

const findings = [];
let scanned = 0;

for (const dialog of chats) {
  const title = dialog.title ?? "без названия";
  let inChat = 0;

  try {
    for await (const message of client.iterMessages(dialog.entity, {
      limit: PER_CHAT_LIMIT,
    })) {
      if (message.date && message.date < cutoff) break; // дошли до края периода
      const text = message.message;
      if (!text || message.out) continue;

      scanned++;
      const key = `${title}:${message.id}`;
      if (seen.has(key)) continue;

      const match = matchLead(text, title);
      if (!match) continue;

      seen.add(key);
      inChat++;
      findings.push({ title, message, text, match, entity: dialog.entity });
    }
  } catch (e) {
    console.error(`Не смог прочитать «${title}»:`, e?.message ?? e);
  }

  console.log(`  ${title}: найдено ${inChat}`);
  await sleep(1500); // не частим запросами к серверам Telegram
}

console.log(`\nПросмотрено ${scanned} сообщений, найдено ${findings.length}`);

// Свежие интереснее: человек, писавший вчера, ещё в поиске.
findings.sort((a, b) => (b.message.date ?? 0) - (a.message.date ?? 0));
const toSend = findings.slice(0, MAX_FINDINGS);

await notify(
  `📚 <b>Разбор истории чатов</b>\n` +
    `Просмотрено ${scanned} сообщений за ${DAYS} дней в ${chats.length} чатах.\n` +
    `Похожих на клиента: <b>${findings.length}</b>` +
    (findings.length > toSend.length ? `, показываю ${toSend.length} самых свежих` : "")
);

for (const f of toSend) {
  const date = new Date((f.message.date ?? 0) * 1000).toLocaleDateString("ru-RU");
  const username = f.entity?.username;
  const link = username
    ? `https://t.me/${username}/${f.message.id}`
    : `https://t.me/c/${String(f.entity?.id ?? "").replace("-100", "")}/${f.message.id}`;
  const preview = f.text.length > 600 ? `${f.text.slice(0, 600)}…` : f.text;

  await notify(
    [
      `📚 <b>Из истории · ${date}</b>`,
      `💬 Чат: ${escapeHtml(f.title)}`,
      "",
      escapeHtml(preview),
      "",
      `🔑 Сработало: ${escapeHtml(
        [...f.match.geo, ...f.match.topic, ...f.match.intent].join(", ")
      )}`,
      `\n<a href="${link}">Открыть сообщение</a>`,
    ].join("\n")
  );
  await sleep(1200); // Telegram не любит очередь сообщений одним залпом
}

// Записываем разобранное, чтобы слушатель и поиск не показали то же ещё раз.
await writeFile(SEEN_FILE, JSON.stringify([...seen].slice(-5000)), "utf8");

console.log("Готово.");
await client.disconnect();
process.exit(0);
