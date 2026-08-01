// Обёртка над Яндекс.Метрикой и Meta Pixel.
// Если счётчик/пиксель не настроен (нет соответствующей переменной окружения) —
// его вызовы молча ничего не делают, сайт продолжает работать как обычно.

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
    fbq?: {
      (action: string, event: string, params?: Record<string, unknown>): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: unknown;
    };
    _fbq?: unknown;
  }
}

export const YM_COUNTER_ID = Number(process.env.NEXT_PUBLIC_YM_COUNTER_ID) || 0;
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID ?? "";

/** Цели, которые нужно завести в интерфейсе Метрики (тип «Целевое событие»). */
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

// Сопоставление наших целей со стандартными событиями Meta.
// Стандартные события («Lead», «Contact») важны: именно под них Meta умеет
// оптимизировать показы и искать похожую аудиторию. Остальное шлём как
// пользовательские события — они видны в статистике, но не для оптимизации.
const META_STANDARD_EVENTS: Record<string, string> = {
  [GOALS.quizSubmit]: "Lead",
  [GOALS.leadFormSubmit]: "Lead",
  [GOALS.phoneClick]: "Contact",
  [GOALS.whatsappClick]: "Contact",
};

const META_CUSTOM_EVENTS: Record<string, string> = {
  [GOALS.quizStart]: "QuizStart",
  [GOALS.quizGoal]: "QuizStepGoal",
  [GOALS.quizBudget]: "QuizStepBudget",
  [GOALS.quizRooms]: "QuizStepRooms",
  [GOALS.quizContacts]: "QuizReachedContacts",
  [GOALS.instagramClick]: "InstagramClick",
};

/** Отправляет цель одновременно в Метрику и в Meta Pixel. */
export function reachGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  if (YM_COUNTER_ID && window.ym) {
    window.ym(YM_COUNTER_ID, "reachGoal", goal, params);
  }

  if (FB_PIXEL_ID && window.fbq) {
    const standard = META_STANDARD_EVENTS[goal];
    if (standard) {
      window.fbq("track", standard, params);
    } else {
      const custom = META_CUSTOM_EVENTS[goal] ?? goal;
      window.fbq("trackCustom", custom, params);
    }
  }
}

/** Просмотр страницы при клиентской навигации (первый хит шлёт сам init). */
export function trackPageView(url: string) {
  if (typeof window === "undefined") return;

  if (YM_COUNTER_ID && window.ym) {
    window.ym(YM_COUNTER_ID, "hit", url);
  }

  if (FB_PIXEL_ID && window.fbq) {
    window.fbq("track", "PageView");
  }
}
