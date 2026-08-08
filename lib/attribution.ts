// Откуда пришёл посетитель. Нужно, чтобы в заявке было видно источник:
// какая рекламная кампания, какой пост, какая посадочная страница.
//
// Модель — first touch: запоминаем ПЕРВЫЙ визит в рамках сессии и больше не
// перезаписываем. Иначе переход внутри сайта или возврат из WhatsApp сотрёт
// рекламную метку, и все лиды станут «прямой заход».

const STORAGE_KEY = "ee_attribution";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

// Идентификаторы клика рекламных систем: приходят даже без utm-меток.
const CLICK_ID_KEYS = ["fbclid", "gclid", "yclid", "ttclid", "ymclid"] as const;

export interface Attribution {
  /** utm_source, fbclid и прочее — как пришло в адресной строке. */
  params: Record<string, string>;
  /** Страница, на которую человек попал первой. */
  landing: string;
  /** Внешний сайт-источник (пусто при прямом заходе). */
  referrer: string;
  /** Момент первого визита, ISO. */
  firstSeen: string;
}

function read(): Attribution | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    // Приватный режим или отключённое хранилище — работаем без атрибуции.
    return null;
  }
}

/**
 * Запоминает источник первого визита. Вызывать один раз при загрузке сайта
 * (см. компонент Attribution) — до того, как посетитель уйдёт с посадочной.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  if (read()) return; // first touch уже зафиксирован

  const url = new URL(window.location.href);
  const params: Record<string, string> = {};
  for (const key of [...UTM_KEYS, ...CLICK_ID_KEYS]) {
    const value = url.searchParams.get(key);
    if (value) params[key] = value.slice(0, 200);
  }

  const referrerHost = (() => {
    if (!document.referrer) return "";
    try {
      const host = new URL(document.referrer).hostname;
      return host === window.location.hostname ? "" : host;
    } catch {
      return "";
    }
  })();

  const attribution: Attribution = {
    params,
    landing: url.pathname + url.search,
    referrer: referrerHost,
    firstSeen: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // не смогли сохранить — не страшно, заявка уйдёт без источника
  }
}

/** Данные об источнике для отправки вместе с заявкой. */
export function getAttribution(): {
  source?: string;
  landing?: string;
  referrer?: string;
  page?: string;
} {
  if (typeof window === "undefined") return {};
  const stored = read();

  // Человекочитаемая строка для уведомления в Telegram:
  // «Instagram / cpc / dubai-reels-3» или «fbclid: IwAR…».
  const source = stored
    ? [
        stored.params.utm_source,
        stored.params.utm_medium,
        stored.params.utm_campaign,
        stored.params.utm_content,
      ]
        .filter(Boolean)
        .join(" / ") ||
      Object.entries(stored.params)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ") ||
      undefined
    : undefined;

  return {
    source,
    landing: stored?.landing,
    referrer: stored?.referrer || undefined,
    page: window.location.pathname,
  };
}
