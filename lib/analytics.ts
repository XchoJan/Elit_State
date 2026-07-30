// Обёртка над Яндекс.Метрикой.
// Если счётчик не настроен (нет NEXT_PUBLIC_YM_COUNTER_ID) — все вызовы
// молча ничего не делают, сайт продолжает работать как обычно.

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
  }
}

export const YM_COUNTER_ID = Number(process.env.NEXT_PUBLIC_YM_COUNTER_ID) || 0;

/** Цели, которые нужно завести в интерфейсе Метрики (тип «JavaScript-событие»). */
export const GOALS = {
  quizStart: "quiz_start", // выбрал город — начал квиз
  quizGoal: "quiz_step_goal", // ответил на «для чего покупаете»
  quizBudget: "quiz_step_budget", // ответил на «бюджет»
  quizRooms: "quiz_step_rooms", // ответил на «комнаты»
  quizContacts: "quiz_contacts", // дошёл до формы контактов
  quizSubmit: "quiz_submit", // отправил заявку из квиза ✅
  leadFormSubmit: "lead_form_submit", // отправил обычную форму ✅
  phoneClick: "phone_click", // нажал на телефон
  whatsappClick: "whatsapp_click", // нажал на WhatsApp
  instagramClick: "instagram_click", // нажал на Instagram
} as const;

export function reachGoal(goal: string, params?: Record<string, unknown>) {
  if (!YM_COUNTER_ID || typeof window === "undefined" || !window.ym) return;
  window.ym(YM_COUNTER_ID, "reachGoal", goal, params);
}

/** Просмотр страницы при клиентской навигации (первый хит шлёт сам init). */
export function trackPageView(url: string) {
  if (!YM_COUNTER_ID || typeof window === "undefined" || !window.ym) return;
  window.ym(YM_COUNTER_ID, "hit", url);
}
