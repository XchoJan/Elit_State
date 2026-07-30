"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { GOALS, YM_COUNTER_ID, reachGoal, trackPageView } from "@/lib/analytics";

export default function YandexMetrika() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Клиентские переходы между страницами — Метрика их сама не видит.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false; // первый хит уже отправил init
      return;
    }
    trackPageView(window.location.href);
  }, [pathname]);

  // Клики по телефону / WhatsApp / Instagram ловим делегированием,
  // чтобы не переводить статические страницы в клиентские компоненты.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as HTMLElement | null)?.closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) reachGoal(GOALS.phoneClick);
      else if (href.includes("wa.me")) reachGoal(GOALS.whatsappClick);
      else if (href.includes("instagram.com")) reachGoal(GOALS.instagramClick);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!YM_COUNTER_ID) return null;

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

          ym(${YM_COUNTER_ID}, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YM_COUNTER_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
