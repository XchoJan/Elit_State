// Проверка сводки по чатам. Без сети и без ключей: npm run test-stats
//
// Главное, что здесь закреплено, — порядок строк в отчёте. Чаты сортируются
// по вашим ✅, а не по числу совпадений, и это не косметика: именно из-за
// этого правила чат с одним живым контактом окажется выше чата с девятью
// срабатываниями словаря, по которым никто не ответил. Если сортировку
// однажды «поправят» на более очевидную — по объёму, — сводка перестанет
// отвечать на вопрос, ради которого её завели.

import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// Модуль вычисляет путь к файлу при импорте, от текущей папки. Уходим во
// временную до импорта: иначе тест затёр бы настоящие счётчики на сервере.
process.chdir(mkdtempSync(path.join(tmpdir(), "chat-stats-test-")));

const {
  loadChatStats,
  chatKey,
  recordSeen,
  recordMatch,
  recordSent,
  recordFeedback,
  buildReport,
  resetPeriod,
} = await import("./chatStats.js");

await loadChatStats();

let failed = 0;
function check(name, ok, hint = "") {
  console.log(`${ok ? "  ok" : "ПРОВАЛ"}  ${name}${ok || !hint ? "" : `\n        ${hint}`}`);
  if (!ok) failed++;
}

// Один и тот же чат приходит в разных написаниях id — в статистике это
// должен быть один чат, иначе он распадётся на три записи с разными цифрами.
check(
  "id чата приводится к одному виду",
  chatKey("-1001234567890") === chatKey("1234567890") &&
    chatKey("-1234567890") === chatKey("1234567890"),
  `-100…: ${chatKey("-1001234567890")}, голый: ${chatKey("1234567890")}`
);
check("пустой id не создаёт запись", chatKey(null) === null && chatKey({}) === null);

const loud = { id: "-1001111111111", title: "Шумный", username: "loud_chat" };
const useful = { id: "-1002222222222", title: "Полезный", username: "useful_chat" };

for (let i = 0; i < 300; i++) recordSeen(loud);
for (let i = 0; i < 30; i++) recordSeen(useful);

const kLoud = chatKey(loud);
const kUseful = chatKey(useful);

// Шумный чат сработал девять раз и все девять оказались мусором.
for (let i = 0; i < 9; i++) {
  recordMatch(kLoud, "estate");
  recordSent(kLoud, "estate");
  recordFeedback(kLoud, "estate", false);
}
// Полезный — один раз, и это живой человек.
recordMatch(kUseful, "estate");
recordSent(kUseful, "estate");
recordFeedback(kUseful, "estate", true);

const report = buildReport("estate", "Недвижимость").join("\n");

check(
  "чат с живым контактом стоит выше чата с девятью пустыми срабатываниями",
  report.indexOf("@useful_chat") < report.indexOf("@loud_chat"),
  report
);
check("в сводке видно ваши отметки", report.includes("✅1") && report.includes("❌9"));
check("итог по оценкам подсчитан", report.includes("✅ 1, ❌ 9"));

// Чат, где идёт бурная жизнь, но словари молчат, — отдельный сигнал: может,
// тема не наша, а может, фильтр мимо. Он должен попадать в сводку.
const busy = { id: "-1003333333333", title: "Болтают", username: "busy_chat" };
for (let i = 0; i < 60; i++) recordSeen(busy);
check(
  "чат без находок, но с потоком сообщений, попадает в отдельный раздел",
  buildReport("estate", "Недвижимость").join("\n").includes("Много говорят")
);

// Чат, промолчавший сутки, — кандидат на отключение.
const silent = { id: "-1004444444444", title: "Тихий", username: "silent_chat" };
recordSeen(silent);
resetPeriod();
for (let i = 0; i < 10; i++) recordSeen(loud);
check(
  "молчавший сутки чат назван в сводке",
  buildReport("estate", "Недвижимость").join("\n").includes("@silent_chat")
);

// Оценки за всё время переживают обнуление периода — иначе после первой же
// сводки радар забывал бы, какие чаты уже показали себя, и на следующий день
// шумный чат снова оказался бы наверху просто по объёму.
for (let i = 0; i < 200; i++) recordSeen(loud);
for (let i = 0; i < 20; i++) recordSeen(useful);
for (let i = 0; i < 9; i++) {
  recordMatch(kLoud, "estate");
  recordSent(kLoud, "estate");
}
recordMatch(kUseful, "estate");
recordSent(kUseful, "estate");

const afterReset = buildReport("estate", "Недвижимость").join("\n");
check(
  "прошлые ✅ продолжают поднимать чат после обнуления периода",
  afterReset.indexOf("@useful_chat") < afterReset.indexOf("@loud_chat"),
  afterReset
);
check(
  "видно, почему чат наверху: итог за всё время показан",
  afterReset.includes("всего ✅1"),
  afterReset
);

resetPeriod();
check("без сообщений за период сводка не собирается", buildReport("estate", "Недвижимость") === null);

console.log(failed ? `\nПровалено проверок: ${failed}` : "\nВсе проверки пройдены.");
process.exit(failed ? 1 : 0);
