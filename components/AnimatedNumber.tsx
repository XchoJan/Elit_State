"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Анимирует ведущее число в строке ("24 часа" -> считает 0→24, оставляя " часа" статичным).
// Строки без числа в начале ("Дистанционно") просто появляются без счётчика.
export default function AnimatedNumber({ value }: { value: string }) {
  const match = value.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState(match ? "0" : value);

  useEffect(() => {
    if (!match || !inView) return;
    const target = parseFloat(match[1].replace(",", "."));
    const isInt = Number.isInteger(target);
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.21, 0.47, 0.32, 0.98],
      onUpdate: (v) => setDisplay(isInt ? String(Math.round(v)) : v.toFixed(1)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  if (!match) {
    return <span ref={ref}>{value}</span>;
  }

  return (
    <span ref={ref}>
      {display}
      {match[2]}
    </span>
  );
}
