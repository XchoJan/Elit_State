"use client";

import { MotionConfig } from "motion/react";

// reducedMotion="user" только мгновенно применяет позиционные свойства
// (x/y/scale/rotate) без сглаживания для тех, у кого в ОС включено
// «уменьшить движение» — opacity и появление контента это не затрагивает.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
