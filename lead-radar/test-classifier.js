// Прогон классификатора на образцах, включая те, что раньше проходили
// через словари как ложные срабатывания. Запуск: npm run test-ai
//
// Проверяет обе темы: у каждой свой промпт, и ошибиться они могут по-разному.
// Словари здесь тоже показаны — если предфильтр не пропустил сообщение,
// в бою до модели оно бы не дошло, каким бы верным ни был её вердикт.
import "dotenv/config";
import { AI_ENABLED, AI_MIN_SCORE, classify } from "./classifier.js";
import { matchLead } from "./keywords.js";
import { matchDevLead } from "./keywordsDev.js";
import { matchWarmLead } from "./keywordsWarm.js";

if (!AI_ENABLED) {
  console.error("Не задан ANTHROPIC_API_KEY в lead-radar/.env — проверять нечем.");
  process.exit(1);
}

const ESTATE = [
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

const DEV = [
  // должны пройти
  ["Ребят, ищу разработчика на телеграм-бота для магазина, бюджет 100к, ТЗ есть", "", true],
  ["Нужен сайт-лендинг для агентства, сроки две недели, сколько будет стоить?", "", true],
  ["Ищем подрядчика на доработку CRM, нужна интеграция с 1С", "", true],
  ["Всё в экселе, хотим личный кабинет для клиентов. Посоветуйте студию?", "", true],
  // не должны
  ["Ищу работу frontend разработчиком, React, 3 года опыта, портфолио в профиле", "", false],
  ["Делаю сайты под ключ на Тильде, обращайтесь в лс, мой рейт 2000 руб/час", "", false],
  ["Вакансия: Python-разработчик в штат, оформление по ТК РФ, оклад от 200 000", "", false],
  ["Подскажите, как лучше сделать авторизацию через API в Next.js?", "", false],
];

const WARM = [
  // должны пройти
  ["Переезжаем с семьёй в Ереван в октябре, оформляем ВНЖ. Какие районы лучше для жизни с детьми?", "", true],
  ["Открываю компанию в Дубае, планирую налоговое резидентство. Кто проходил, сколько занимает?", "", true],
  ["Переехали в Батуми, ищем школу для ребёнка. Что посоветуете по районам?", "", true],
  // не должны
  ["Еду в Дубай на неделю в отпуск, что посмотреть и где поесть?", "", false],
  ["Помогаем с ВНЖ в Армении и Грузии под ключ, обращайтесь в личку", "", false],
];

async function run(title, cases, matcher, profile) {
  console.log(`\n=== ${title} ===`);
  let ok = 0;
  for (const [text, chat, expected] of cases) {
    const pre = matcher(text, chat);
    const ai = await classify({ text, chatTitle: chat, source: "Telegram", profile });

    const shown = Boolean(ai?.is_lead && ai.lead_score >= AI_MIN_SCORE);
    // В бою модель видит только то, что пропустили словари.
    const reachesYou = Boolean(pre) && shown;
    const correct = reachesYou === expected;
    if (correct) ok++;

    console.log(
      `${correct ? "✅" : "❌"} ${reachesYou ? "ЛИД " : "мимо"} | словари: ${pre ? pre.score : "—"} | ` +
        `AI: ${ai ? `${ai.lead_score}/100 ${ai.temperature} ${ai.intent}` : "сбой"} | ${text.slice(0, 52)}`
    );
    if (!correct && expected && !pre) {
      console.log("     предфильтр не пропустил — до модели такое сообщение не дойдёт");
    }
    if (ai && reachesYou) {
      const what =
        profile === "dev"
          ? ai.project_type
          : profile === "warm"
            ? `${ai.country} · ${ai.stage} · жильё через ${ai.horizon}`
            : ai.location;
      console.log(`     ${what} · ${ai.budget} ${ai.currency} · ${ai.timeframe}`);
      console.log(`     ${ai.reason}`);
    }
  }
  console.log(`Верно: ${ok} из ${cases.length}`);
  return ok === cases.length;
}

const a = await run("Недвижимость", ESTATE, matchLead, "estate");
const b = await run("Разработка", DEV, matchDevLead, "dev");
const c = await run("Тёплый контакт", WARM, matchWarmLead, "warm");
process.exit(a && b && c ? 0 : 1);
