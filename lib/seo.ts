// Разметка Schema.org (JSON-LD). Поисковики читают её, чтобы показать
// расширенный сниппет: телефон агентства, вопросы-ответы, хлебные крошки.
// Всё, что здесь описано, обязано совпадать с тем, что видно на странице —
// иначе разметка считается недостоверной и её просто игнорируют.

import {
  CONTACT_PHONE,
  INSTAGRAM_HREF,
  SITE_NAME,
  SITE_URL,
  type FaqItem,
} from "@/lib/data";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Международное агентство недвижимости: подбор и сопровождение сделок в Дубае, Ереване, Грузии и России.",
    telephone: CONTACT_PHONE,
    sameAs: [INSTAGRAM_HREF],
    areaServed: [
      { "@type": "Country", name: "ОАЭ" },
      { "@type": "Country", name: "Армения" },
      { "@type": "Country", name: "Грузия" },
      { "@type": "Country", name: "Россия" },
    ],
    priceRange: "$$$",
  };
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbsJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: `${SITE_URL}${step.path}`,
    })),
  };
}
