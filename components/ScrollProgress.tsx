// Полоска прогресса чтения. Раньше её положение считал JS (useScroll +
// пружина из framer-motion); теперь это чистый CSS, привязанный к прокрутке
// документа. Где такие анимации не поддерживаются — полоски просто нет,
// это декор, ради которого не стоит тянуть библиотеку в бандл.
export default function ScrollProgress() {
  return (
    <div
      aria-hidden="true"
      className="scroll-progress fixed inset-x-0 top-0 z-[60] h-[3px] origin-left scale-x-0 bg-gradient-to-r from-accent to-accent-dark"
    />
  );
}
