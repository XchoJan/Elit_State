import type { ReactNode } from "react";

// Появление блоков при прокрутке. Раньше это был клиентский компонент на
// framer-motion, и до загрузки JS весь контент лежал с opacity:0 — страница
// выглядела пустой. Теперь это обычная серверная разметка с CSS-классом:
// разметка приходит видимой, а анимацию (если браузер умеет) навешивает
// правило `.reveal` в globals.css.

export function Reveal({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  /** Якорь для ссылок вида «#podbor». */
  id?: string;
}) {
  return (
    <div id={id} className={className ? `reveal ${className}` : "reveal"}>
      {children}
    </div>
  );
}

export function RevealStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `reveal-stagger ${className}` : "reveal-stagger"}>
      {children}
    </div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `reveal ${className}` : "reveal"}>{children}</div>
  );
}
