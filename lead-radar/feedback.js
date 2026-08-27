// Кнопки ✅/❌ под находками и приём ваших нажатий.
//
// Радар умеет считать, сколько сообщений он прочитал и сколько раз сработали
// словари. Чего он сам знать не может — оказалась ли находка живым человеком.
// Это знаете только вы, и одно нажатие кнопки стоит больше, чем любая
// автоматическая оценка: по нему видно, какие чаты держать, а какие выключать.
//
// Как устроено: под каждым уведомлением две кнопки. Нажатие прилетает боту
// как callback_query, мы его забираем длинным опросом getUpdates, записываем
// в статистику чата и заменяем кнопки на отметку о том, что выбрано.
//
// Про getUpdates: у одного бота может быть только один читатель обновлений.
// Сайт этот токен использует только на отправку заявок, вебхука у бота нет —
// поэтому опрос здесь безопасен. Если вебхук когда-нибудь появится, опрос
// начнёт получать 409: в этом случае мы не отбираем вебхук у того, кто его
// поставил, а просто выключаем кнопки и говорим об этом в лог.

import { recordFeedback } from "./chatStats.js";

/** Сколько секунд держать длинный запрос. Telegram разрешает до 50. */
const POLL_TIMEOUT = 30;

/**
 * Тело callback_data ограничено 64 байтами, поэтому пишем коротко:
 * f:g:estate:1234567890 — «оценка, хорошая, тема, ключ чата».
 */
export function feedbackKeyboard(profileId, chatKey) {
  if (!chatKey) return undefined;
  return {
    inline_keyboard: [
      [
        { text: "✅ Живой", callback_data: `f:g:${profileId}:${chatKey}` },
        { text: "❌ Мусор", callback_data: `f:b:${profileId}:${chatKey}` },
      ],
    ],
  };
}

async function api(botToken, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => ({ ok: false }));
}

function voterName(from) {
  const name = [from?.first_name, from?.last_name].filter(Boolean).join(" ");
  return name || from?.username || "кто-то";
}

async function handleCallback(botToken, query) {
  const data = String(query.data ?? "");
  const parts = data.split(":");
  if (parts[0] !== "f") return;

  // Кнопка уже нажата и заменена на отметку — на всякий случай отвечаем тихо.
  if (parts[1] === "done") {
    await api(botToken, "answerCallbackQuery", { callback_query_id: query.id });
    return;
  }

  const [, verdict, profileId, chatKey] = parts;
  if (!profileId || !chatKey) return;

  const isGood = verdict === "g";
  recordFeedback(chatKey, profileId, isGood);

  await api(botToken, "answerCallbackQuery", {
    callback_query_id: query.id,
    text: isGood ? "Записал: живой контакт" : "Записал: мусор",
  });

  // Кнопки заменяем одной отметкой. Так видно, что оценка учтена, и повторно
  // нажать уже нечего — иначе один и тот же лид накручивал бы счётчик.
  const mark = isGood ? "✅ Живой" : "❌ Мусор";
  await api(botToken, "editMessageReplyMarkup", {
    chat_id: query.message?.chat?.id,
    message_id: query.message?.message_id,
    reply_markup: {
      inline_keyboard: [
        [{ text: `${mark} — ${voterName(query.from)}`, callback_data: "f:done" }],
      ],
    },
  });
}

/**
 * Бесконечный цикл опроса. Запускается без await: он не должен задерживать
 * старт радара, а падать ему нельзя — любая ошибка гасится паузой и повтором.
 */
export async function startFeedbackLoop(botToken) {
  const info = await api(botToken, "getWebhookInfo", {});
  if (info?.result?.url) {
    console.warn(
      `У бота установлен вебхук (${info.result.url}) — кнопки оценки выключены. ` +
        "Забирать обновления может только кто-то один, и отбирать их у вебхука опасно."
    );
    return;
  }

  // Пропускаем всё, что накопилось до запуска: старые нажатия относятся к
  // прошлой жизни счётчиков, и учитывать их сейчас было бы враньём.
  let offset = 0;
  const backlog = await api(botToken, "getUpdates", {
    offset: -1,
    allowed_updates: ["callback_query"],
  });
  const last = backlog?.result?.at(-1);
  if (last) offset = last.update_id + 1;

  console.log("Кнопки оценки находок включены.");

  for (;;) {
    try {
      const res = await api(botToken, "getUpdates", {
        offset,
        timeout: POLL_TIMEOUT,
        allowed_updates: ["callback_query"],
      });

      if (!res?.ok) {
        // 409 значит, что обновления забирает кто-то ещё. Спорить бесполезно.
        if (res?.error_code === 409) {
          console.warn("Обновления бота читает другой процесс — кнопки выключены.");
          return;
        }
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      for (const update of res.result ?? []) {
        offset = update.update_id + 1;
        if (update.callback_query) {
          await handleCallback(botToken, update.callback_query).catch((e) =>
            console.error("Ошибка обработки нажатия:", e?.message ?? e)
          );
        }
      }
    } catch (e) {
      console.error("Опрос обновлений сорвался:", e?.message ?? e);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
