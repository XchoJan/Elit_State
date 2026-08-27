// Учёт по каждому чату отдельно.
//
// Зачем: раньше радар считал всё общей кучей — «просмотрено 5900, совпало 40».
// Из какого чата эти сорок, а какие тридцать пять чатов молчали всё время,
// понять было невозможно. Поэтому на вопрос «добавить ещё чатов?» можно было
// только гадать.
//
// Теперь на каждый чат хранится: сколько сообщений прочитано, сколько совпало
// по каждой теме, сколько отправлено вам и как вы это оценили кнопками.
// Раз в сутки радар присылает сводку и обнуляет счётчики периода — накопленные
// за всё время итоги при этом остаются.
//
// Оценка человека здесь важнее всех автоматических цифр. Чат может выдавать
// по тридцать «находок» в день и не дать ни одного живого разговора — такой
// чат надо не улучшать фильтром, а выключать.

import { readFile, writeFile } from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "chat-stats.json");

/** chatKey → запись. Пишется часто, сохраняется по таймеру. */
let chats = new Map();
let dirty = false;

/**
 * Один и тот же чат приходит то как -1001234567890, то как 1234567890 —
 * зависит от того, откуда взялся объект. Без приведения к общему виду
 * один чат распадался бы в статистике на два-три разных.
 */
export function chatKey(chatOrId) {
  const raw = typeof chatOrId === "object" ? chatOrId?.id : chatOrId;
  if (!raw) return null;
  return String(raw).replace("-100", "").replace(/^-/, "");
}

function blank() {
  return {
    title: "",
    username: "",
    // Счётчики периода — обнуляются после каждой сводки.
    seen: 0,
    matched: {},
    sent: {},
    good: {},
    bad: {},
    // Итоги за всё время — не обнуляются, по ним видно долгую картину.
    totalSeen: 0,
    totalMatched: {},
    totalGood: {},
    totalBad: {},
    lastMessageAt: 0,
  };
}

function entry(key) {
  let rec = chats.get(key);
  if (!rec) {
    rec = blank();
    chats.set(key, rec);
  }
  return rec;
}

function bump(bag, profileId) {
  bag[profileId] = (bag[profileId] ?? 0) + 1;
}

export async function loadChatStats() {
  try {
    const raw = JSON.parse(await readFile(FILE, "utf8"));
    chats = new Map(Object.entries(raw).map(([k, v]) => [k, { ...blank(), ...v }]));
  } catch {
    chats = new Map(); // первый запуск — файла ещё нет
  }
}

export async function saveChatStats(force = false) {
  if (!dirty && !force) return;
  try {
    await writeFile(FILE, JSON.stringify(Object.fromEntries(chats)), "utf8");
    dirty = false;
  } catch (e) {
    console.error("Не удалось сохранить статистику по чатам:", e?.message ?? e);
  }
}

/** Сообщение прочитано. Заодно обновляем название: чаты переименовывают. */
export function recordSeen(chat) {
  const key = chatKey(chat);
  if (!key) return null;
  const rec = entry(key);
  rec.seen++;
  rec.totalSeen++;
  rec.lastMessageAt = Date.now();
  if (chat?.title) rec.title = chat.title;
  if (chat?.username) rec.username = chat.username;
  dirty = true;
  return key;
}

/** Словари сказали «похоже» — ещё не значит, что вам это отправили. */
export function recordMatch(chatOrKey, profileId) {
  const key = typeof chatOrKey === "string" ? chatOrKey : chatKey(chatOrKey);
  if (!key) return;
  const rec = entry(key);
  bump(rec.matched, profileId);
  bump(rec.totalMatched, profileId);
  dirty = true;
}

/** Уведомление действительно ушло вам в канал. */
export function recordSent(chatOrKey, profileId, meta = {}) {
  const key = typeof chatOrKey === "string" ? chatOrKey : chatKey(chatOrKey);
  if (!key) return;
  const rec = entry(key);
  bump(rec.sent, profileId);
  if (meta.title && !rec.title) rec.title = meta.title;
  if (meta.username && !rec.username) rec.username = meta.username;
  dirty = true;
}

/** Ваша оценка находки: живой человек или мусор. */
export function recordFeedback(key, profileId, isGood) {
  if (!key) return;
  const rec = entry(key);
  bump(isGood ? rec.good : rec.bad, profileId);
  bump(isGood ? rec.totalGood : rec.totalBad, profileId);
  dirty = true;
}

/** Как называть чат в сводке: @имя читается лучше числового id. */
function label(key, rec) {
  if (rec.username) return `@${rec.username}`;
  if (rec.title) return rec.title.length > 28 ? `${rec.title.slice(0, 27)}…` : rec.title;
  return `id ${key}`;
}

/**
 * Сводка по одной теме. Возвращает массив строк или null, если сообщений
 * за период не было вообще — присылать пустую таблицу незачем.
 *
 * Сортировка по вашим ✅, а не по числу находок: чат, давший один живой
 * контакт, полезнее чата с тридцатью совпадениями и нулём ответов.
 */
export function buildReport(profileId, profileLabel) {
  const rows = [...chats.entries()]
    .map(([key, rec]) => ({
      key,
      rec,
      name: label(key, rec),
      seen: rec.seen,
      matched: rec.matched[profileId] ?? 0,
      sent: rec.sent[profileId] ?? 0,
      good: rec.good[profileId] ?? 0,
      bad: rec.bad[profileId] ?? 0,
      totalGood: rec.totalGood[profileId] ?? 0,
      totalBad: rec.totalBad[profileId] ?? 0,
      totalMatched: rec.totalMatched[profileId] ?? 0,
    }))
    .sort(
      (a, b) =>
        b.totalGood - a.totalGood || b.good - a.good || b.matched - a.matched || b.seen - a.seen
    );

  const totalSeen = rows.reduce((n, r) => n + r.seen, 0);
  if (!totalSeen) return null;

  const live = rows.filter((r) => r.seen > 0);
  const silent = rows.filter((r) => r.seen === 0);
  const withFindings = live.filter((r) => r.matched > 0);

  const lines = [
    `📊 <b>Сводка за сутки — ${profileLabel}</b>`,
    `Прочитано ${totalSeen} сообщений из ${live.length} говоривших чатов.`,
    "",
  ];

  if (withFindings.length) {
    lines.push("<b>Что дало находки:</b>");
    for (const r of withFindings.slice(0, 12)) {
      const marks = [r.good ? `✅${r.good}` : "", r.bad ? `❌${r.bad}` : ""]
        .filter(Boolean)
        .join(" ");
      // Итог за всё время показываем, только если он шире сегодняшнего.
      // Без него порядок строк выглядит произвольным: чат стоит первым из-за
      // оценок, поставленных на прошлой неделе, а в сводке их не видно.
      const lifetime =
        r.totalGood + r.totalBad > r.good + r.bad
          ? ` (всего ✅${r.totalGood} ❌${r.totalBad})`
          : "";
      lines.push(
        `${r.name} — ${r.seen} сообщ., ${r.matched} совпад., ${r.sent} отправлено` +
          (marks ? ` · ${marks}` : "") +
          lifetime
      );
    }
    lines.push("");
  }

  // Чаты, где кипит жизнь, но радар ничего не находит. Это не всегда плохо:
  // может, там просто не наша тема — а может, словарь мимо. Разбираться стоит.
  const busyEmpty = live.filter((r) => r.seen >= 50 && r.matched === 0);
  if (busyEmpty.length) {
    lines.push("<b>Много говорят, но ничего не подходит:</b>");
    for (const r of busyEmpty.slice(0, 8)) {
      lines.push(`${r.name} — ${r.seen} сообщ., 0 совпадений`);
    }
    lines.push("");
  }

  if (silent.length) {
    lines.push(
      `<b>Молчали сутки:</b> ${silent.length} ${
        silent.length === 1 ? "чат" : "чатов"
      } — ${silent.slice(0, 10).map((r) => r.name).join(", ")}` +
        (silent.length > 10 ? " и другие" : "")
    );
    lines.push("");
  }

  const good = rows.reduce((n, r) => n + r.good, 0);
  const bad = rows.reduce((n, r) => n + r.bad, 0);
  lines.push(
    good + bad
      ? `Ваши оценки за сутки: ✅ ${good}, ❌ ${bad}.`
      : "За сутки вы не оценили ни одной находки — без этого сводка показывает только объём, а не пользу."
  );

  return lines;
}

/** Обнулить счётчики периода. Итоги за всё время остаются. */
export function resetPeriod() {
  for (const rec of chats.values()) {
    rec.seen = 0;
    rec.matched = {};
    rec.sent = {};
    rec.good = {};
    rec.bad = {};
  }
  dirty = true;
}
