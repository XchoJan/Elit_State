// Прогон классификатора на образцах, включая те, что раньше проходили
// через словари как ложные срабатывания. Запуск: npm run test-ai
import "dotenv/config";
import { AI_ENABLED, AI_MIN_SCORE, classify } from "./classifier.js";
import { matchLead } from "./keywords.js";

if (!AI_ENABLED) {
  console.error("Не задан ANTHROPIC_API_KEY в lead-radar/.env — проверять нечем.");
  process.exit(1);
}

const CASES = [
  // должны пройти
  ["Ребят, ищу квартиру в Дубае, бюджет до 370к, что посоветуете?", "", true],
  ["Хочу купить 2-комнатную в Ереване до $120k, планирую в ближайшие 2 месяца", "", true],
  ["Какая сейчас доходность аренды в Батуми, если брать под инвестиции?", "", true],
  ["Кто знает надёжного риэлтора в Дубае для покупки?", "", true],
  // не должны
  ["Здравствуйте, меня зовут Бениамин, у меня удостоверение беженца, ищу возможность работать. Вид на жительство нужен для трудоустройства.", "", false],
  ["Ищу квартиру в Ереване снять на два месяца, бюджет 500$ в месяц", "", false],
  ["🏠 Аренда | Арабкир, 2-комн. квартира, 50 м², 600$", "Недвижимость Еревана", false],
  ["Продам свою квартиру в Тбилиси, срочно, 85к", "", false],
  ["Цены на квартиры в Ереване сильно выросли за год", "", false],
  ["Ищу квартиру в Берлине, бюджет 400к евро", "", false],
];

let ok = 0;
for (const [text, chat, expected] of CASES) {
  const pre = matchLead(text, chat);
  const ai = await classify({ text, chatTitle: chat, source: "Telegram" });

  const shown = Boolean(ai?.is_lead && ai.lead_score >= AI_MIN_SCORE);
  const correct = shown === expected;
  if (correct) ok++;

  console.log(
    `${correct ? "✅" : "❌"} ${shown ? "ЛИД " : "мимо"} | словари: ${pre ? pre.score : "—"} | ` +
      `AI: ${ai ? `${ai.lead_score}/100 ${ai.temperature} ${ai.intent}` : "сбой"} | ${text.slice(0, 52)}`
  );
  if (ai && shown) {
    console.log(`     ${ai.location} · ${ai.budget} ${ai.currency} · ${ai.timeframe}`);
    console.log(`     ${ai.reason}`);
  }
}

console.log(`\nВерно: ${ok} из ${CASES.length}`);
