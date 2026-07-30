import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MotionProvider from "@/components/MotionProvider";
import ScrollProgress from "@/components/ScrollProgress";
import YandexMetrika from "@/components/YandexMetrika";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "Elit Estate — недвижимость в Дубае, Ереване, Грузии и России",
    template: "%s — Elit Estate",
  },
  description:
    "Международное агентство недвижимости Elit Estate: квартиры, дома и инвестиционные объекты в Дубае, Ереване, Грузии и России. Подбор под ключ, сопровождение сделки, рассрочка от застройщиков.",
  keywords: [
    "недвижимость Дубай",
    "квартиры Ереван",
    "недвижимость Грузия",
    "новостройки Россия",
    "купить квартиру за рубежом",
    "инвестиции в недвижимость",
  ],
  openGraph: {
    title: "Elit Estate — дома вашей мечты в 4 странах",
    description:
      "Квартиры, виллы и пентхаусы в Дубае, Ереване, Грузии и России. Найдите дом своей мечты.",
    type: "website",
    locale: "ru_RU",
  },
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
        <MotionProvider>
          <ScrollProgress />
          <Header />
          {children}
          <Footer />
        </MotionProvider>
        <YandexMetrika />
      </body>
    </html>
  );
}
