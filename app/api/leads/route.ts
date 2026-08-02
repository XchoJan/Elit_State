import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

// Заявки сохраняются в data/leads.json и дублируются в Telegram (см. sendToTelegram).
const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");

interface Lead {
  name: string;
  phone: string;
  message?: string;
  subject?: string;
  createdAt: string;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendToTelegram(lead: Lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const lines = [
    "🏠 <b>Новая заявка — Elite Estate</b>",
    lead.subject ? `Источник: ${escapeHtml(lead.subject)}` : undefined,
    `Имя: ${escapeHtml(lead.name)}`,
    `Телефон: ${escapeHtml(lead.phone)}`,
    lead.message ? `Комментарий: ${escapeHtml(lead.message)}` : undefined,
  ].filter(Boolean);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    console.error("Telegram API error:", await res.text());
  }
}

export async function POST(request: Request) {
  let body: Partial<Lead>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 200);
  const phone = String(body.phone ?? "").trim().slice(0, 50);
  if (!name || !phone) {
    return NextResponse.json(
      { error: "Имя и телефон обязательны" },
      { status: 400 }
    );
  }

  const lead: Lead = {
    name,
    phone,
    message: String(body.message ?? "").trim().slice(0, 2000) || undefined,
    subject: String(body.subject ?? "").trim().slice(0, 300) || undefined,
    createdAt: new Date().toISOString(),
  };

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
  } catch (e) {
    console.error("Не удалось сохранить заявку:", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }

  try {
    await sendToTelegram(lead);
  } catch (e) {
    // Заявка уже сохранена в файл — не роняем запрос из-за сбоя Telegram
    console.error("Не удалось отправить заявку в Telegram:", e);
  }

  return NextResponse.json({ ok: true });
}
