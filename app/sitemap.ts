import type { MetadataRoute } from "next";
import { cities, SITE_URL } from "@/lib/data";

// Карта сайта: /sitemap.xml. Её адрес указан в robots.txt, и её же
// нужно вручную добавить в Google Search Console и Яндекс.Вебмастер —
// без этого индексация новых страниц занимает недели вместо дней.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Страницы направлений — главные точки входа из поиска и рекламы.
    ...cities.map((city) => ({
      url: `${SITE_URL}${city.path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contacts`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
