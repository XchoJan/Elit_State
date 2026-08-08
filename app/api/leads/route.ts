import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

// Заявка доставляется в Telegram — это основной и единственный надёжный канал.
// Копия пишется в data/leads.json, но только как локальный архив: на хостингах
// с read-only файловой системой (Vercel и подобные) запись падает, и это НЕ
// повод терять заявку. Поэтому порядок такой: сначала Telegram, потом файл.
const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");

interface Lead {
  name: string;
  phone: string;
  message?: string;
  subject?: string;
  /** Рекламный источник: «instagram / cpc / dubai-reels-3». */
  source?: string;
  /** Первая страница визита вместе с utm-метками. */
  landing?: string;
  /** Сайт, с которого пришёл посетитель. */
  referrer?: string;
  /** Страница, с которой отправлена заявка. */
  page?: string;
  createdAt: string;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function field(value: string | undefined, max: number): string | undefined {
  const trimmed = String(value ?? "").trim().slice(0, max);
  return trimmed || undefined;
}

async function sendToTelegram(lead: Lead): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // Получателей можно перечислить через запятую: группа отдела продаж плюс
  // личка руководителя. Обычную группу Telegram однажды повышает до
  // супергруппы, её id при этом меняется и доставка молча ломается —
  // второй адрес страхует от такой тихой поломки.
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!token || !chatIds.length) {
    console.warn(
      "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы — заявка не будет доставлена в Telegram"
    );
    return false;
  }

  const lines = [
    "🏠 <b>Новая заявка — Elite Estate</b>",
    lead.subject ? `Форма: ${escapeHtml(lead.subject)}` : undefined,
    `Имя: ${escapeHtml(lead.name)}`,
    `Телефон: <code>${escapeHtml(lead.phone)}</code>`,
    lead.message ? `Комментарий: ${escapeHtml(lead.message)}` : undefined,
    lead.source ? `📊 Источник: ${escapeHtml(lead.source)}` : undefined,
    lead.referrer ? `↩️ Перешёл с: ${escapeHtml(lead.referrer)}` : undefined,
    lead.landing ? `🔗 Вошёл на: ${escapeHtml(lead.landing)}` : undefined,
    lead.page && lead.page !== lead.landing
      ? `📄 Отправил со страницы: ${escapeHtml(lead.page)}`
      : undefined,
  ].filter(Boolean);

  const text = lines.join("\n");

  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
        });

        if (!res.ok) {
          console.error(`Telegram API error (chat ${chatId}):`, await res.text());
          return false;
        }
        return true;
      } catch (e) {
        console.error(`Не удалось отправить заявку в Telegram (chat ${chatId}):`, e);
        return false;
      }
    })
  );

  // Доставкой считаем успех хотя бы по одному адресу.
  return results.some(Boolean);
}

async function appendToFile(lead: Lead): Promise<boolean> {
  try {
    await mkdir(path.dirname(LEADS_FILE), { recursive: true });
    let leads: Lead[] = [];
    try {
      leads = JSON.parse(await readFile(LEADS_FILE, "utf8"));
    } catch {
      // файла ещё нет — начнём с пустого списка
    }
    leads.push(lead);
    await writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
    return true;
  } catch (e) {
    // Обычная ситуация на serverless-хостинге: файловая система только на чтение.
    console.error("Не удалось записать заявку в файл:", e);
    return false;
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  // Ловушка для ботов: поле скрыто от людей, заполнить его может только робот.
  // Отвечаем «ок», чтобы бот не искал обход, но заявку никуда не отправляем.
  if (field(body.company as string, 100)) {
    return NextResponse.json({ ok: true });
  }

  const name = field(body.name as string, 200);
  const phone = field(body.phone as string, 50);
  if (!name || !phone) {
    return NextResponse.json(
      { error: "Имя и телефон обязательны" },
      { status: 400 }
    );
  }

  const lead: Lead = {
    name,
    phone,
    message: field(body.message as string, 2000),
    subject: field(body.subject as string, 300),
    source: field(body.source as string, 300),
    landing: field(body.landing as string, 300),
    referrer: field(body.referrer as string, 200),
    page: field(body.page as string, 200),
    createdAt: new Date().toISOString(),
  };

  const [delivered, archived] = await Promise.all([
    sendToTelegram(lead),
    appendToFile(lead),
  ]);

  if (!delivered && !archived) {
    // Ни один канал не сработал — заявка действительно потеряна, и человек
    // должен об этом узнать: форма покажет телефон для звонка.
    console.error("ЗАЯВКА ПОТЕРЯНА:", JSON.stringify(lead));
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
