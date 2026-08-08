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

/** Ссылка на конкретное сообщение: публичные чаты по имени, приватные — через /c/. */
function messageLink(chat, messageId) {
  if (chat?.username) return `https://t.me/${chat.username}/${messageId}`;
  if (chat?.id) return `https://t.me/c/${String(chat.id).replace("-100", "")}/${messageId}`;
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

client.addEventHandler(async (event) => {
  try {
    const message = event.message;
    const text = message?.message;
    if (!text || message.out) return; // свои сообщения не анализируем

    const chat = await event.getChat();
    // Личные переписки пропускаем: там и так видно, что пишут.
    if (!chat || chat.className === "User") return;
    if (!isWatched(chat)) return;

    const match = matchLead(text, chat.title ?? "");
    if (!match) return;

    const sender = await event.getSender().catch(() => null);
    if (sender?.bot) return;

    if (rateLimited()) {
      console.warn("Лимит уведомлений исчерпан — сообщение пропущено");
      return;
    }

    const link = messageLink(chat, message.id);
    const preview = text.length > 700 ? `${text.slice(0, 700)}…` : text;

    await notify(
      [
        "🎯 <b>Похоже на клиента</b>",
        `💬 Чат: ${escapeHtml(chat.title ?? "без названия")}`,
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

    console.log(`[${new Date().toLocaleTimeString()}] находка в «${chat.title}»`);
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

await notify("🟢 Lead radar запущен и слушает чаты.");
