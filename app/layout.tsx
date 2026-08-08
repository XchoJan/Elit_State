import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MotionProvider from "@/components/MotionProvider";
import ScrollProgress from "@/components/ScrollProgress";
import YandexMetrika from "@/components/YandexMetrika";
import MetaPixel from "@/components/MetaPixel";
import Attribution from "@/components/Attribution";
import JsonLd from "@/components/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/data";
import { organizationJsonLd } from "@/lib/seo";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  // Без metadataBase относительные canonical и og:url превращаются
  // в битые ссылки — поисковики и соцсети требуют абсолютный адрес.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Elite Estate — недвижимость в Дубае, Ереване, Грузии и России",
    template: "%s — Elite Estate",
  },
  description:
    "Международное агентство недвижимости Elite Estate: квартиры, дома и инвестиционные объекты в Дубае, Ереване, Грузии и России. Подбор под ключ, сопровождение сделки, рассрочка от застройщиков.",
  keywords: [
    "недвижимость Дубай",
    "квартиры Ереван",
    "недвижимость Грузия",
    "новостройки Россия",
    "купить квартиру за рубежом",
    "инвестиции в недвижимость",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Elite Estate — дома вашей мечты в 4 странах",
    description:
      "Квартиры, виллы и пентхаусы в Дубае, Ереване, Грузии и России. Найдите дом своей мечты.",
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "ru_RU",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd data={organizationJsonLd()} />
        <Attribution />
        <MotionProvider>
          <ScrollProgress />
          <Header />
          {children}
          <Footer />
        </MotionProvider>
        <YandexMetrika />
        <MetaPixel />
      </body>
    </html>
  );
}
