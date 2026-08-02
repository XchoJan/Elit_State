export type CitySlug = "dubai" | "yerevan" | "tbilisi" | "krasnodar";

export interface CityStat {
  label: string;
  value: string;
  note?: string;
}

export interface City {
  slug: CitySlug;
  name: string;
  nameIn: string; // «в Дубае»
  country: string;
  countryFlag: string;
  tagline: string;
  description: string;
  // Ориентиры по открытым рыночным данным — показываются со сноской «≈, уточняйте у менеджера»
  stats: CityStat[];
  highlight: string;
}

export const cities: City[] = [
  {
    slug: "dubai",
    name: "Дубай",
    nameIn: "в Дубае",
    country: "ОАЭ",
    countryFlag: "🇦🇪",
    tagline: "Небоскрёбы, море и нулевой налог на доход",
    description:
      "Мировая столица инвестиций в недвижимость: рассрочки от застройщиков без процентов, резидентская виза при покупке и стабильный арендный спрос круглый год.",
    stats: [
      { label: "Цена квадратного метра", value: "≈ $4 500+" },
      { label: "Доходность аренды", value: "до 8% в год" },
      { label: "Налог на арендный доход", value: "0%" },
    ],
    highlight: "Резидентская виза при покупке от $205 000",
  },
  {
    slug: "yerevan",
    name: "Ереван",
    nameIn: "в Ереване",
    country: "Армения",
    countryFlag: "🇦🇲",
    tagline: "Растущий рынок в сердце Кавказа",
    description:
      "Динамичная столица с новыми жилыми кварталами и простым оформлением для иностранцев. Хорош и для жизни, и для сдачи в аренду: спрос со стороны экспатов и IT-специалистов стабильно высок.",
    stats: [
      { label: "Цена квадратного метра в центре", value: "от $1 300" },
      { label: "Доходность аренды", value: "до 8% в год" },
      { label: "Оформление сделки", value: "1–3 дня" },
    ],
    highlight: "Покупка недвижимости — основание для ВНЖ",
  },
  {
    slug: "tbilisi",
    name: "Грузия",
    nameIn: "по всей Грузии",
    country: "",
    countryFlag: "🇬🇪",
    tagline: "Тбилиси, Батуми и другие города",
    description:
      "Один из самых доступных порогов входа в регионе и мощный туристический поток — от исторического Тбилиси до курортного Батуми. Иностранцы покупают недвижимость свободно по всей стране, сделка оформляется в Доме юстиции за один визит.",
    stats: [
      { label: "Цена квадратного метра", value: "от $1 000+" },
      { label: "Доходность аренды", value: "до 10% в год" },
      { label: "Оформление сделки", value: "1 день" },
    ],
    highlight: "Без визы до 1 года — в любом городе страны",
  },
  {
    slug: "krasnodar",
    name: "Россия",
    nameIn: "по всей России",
    country: "",
    countryFlag: "🇷🇺",
    tagline: "От Краснодара и Сочи до Москвы и Петербурга",
    description:
      "Один из крупнейших рынков недвижимости в мире: от тёплого и быстрорастущего юга (Краснодар, Сочи) до столичных Москвы и Санкт-Петербурга — большой выбор новостроек комфорт- и бизнес-класса от крупных застройщиков.",
    stats: [
      { label: "Цена квадратного метра", value: "от 100 тыс ₽" },
      { label: "География", value: "Юг, Москва, СПб" },
      { label: "Ипотека и рассрочки", value: "от застройщиков" },
    ],
    highlight: "Семейная ипотека и субсидированные ставки",
  },
];

export const STATS_DISCLAIMER =
  "Ориентиры по открытым рыночным данным на июль 2026 года. Точные цены и условия зависят от объекта — уточняйте у менеджера.";

export function getCity(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug);
}

export const CONTACT_PHONE = "+374 91 446615";
export const CONTACT_PHONE_HREF = "tel:+37491446615";
export const WHATSAPP_HREF =
  "https://wa.me/37491446615?text=" +
  encodeURIComponent("Здравствуйте! Хочу подобрать недвижимость. Пишу с сайта Elite Estate.");
export const INSTAGRAM_HREF = "https://www.instagram.com/eliteestate_am/";
