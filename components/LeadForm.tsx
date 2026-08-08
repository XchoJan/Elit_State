"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { GOALS, reachGoal } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";

export default function LeadForm({
  subject,
  compact = false,
}: {
  subject?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          subject: subject ?? "Общая заявка",
          ...getAttribution(),
        }),
      });
      if (!res.ok) throw new Error();
      reachGoal(GOALS.leadFormSubmit, { subject: subject ?? "Общая заявка" });
      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
      >
        <p className="text-lg font-semibold text-emerald-800">Заявка отправлена!</p>
        <p className="mt-1 text-sm text-emerald-700">
          Наш менеджер свяжется с вами в ближайшее время.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      {/* Ловушка для спам-ботов: человек это поле не видит и не заполняет. */}
      <input
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <input
        name="name"
        required
        placeholder="Ваше имя"
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
      />
      <input
        name="phone"
        required
        type="tel"
        placeholder="Телефон или WhatsApp"
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
      />
      {!compact && (
        <textarea
          name="message"
          rows={3}
          placeholder="Что вы ищете? Город, бюджет, количество комнат…"
          className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
        />
      )}
      <motion.button
        type="submit"
        disabled={status === "sending"}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
      >
        {status === "sending" ? "Отправляем…" : "Получить подборку объектов"}
      </motion.button>
      {status === "error" && (
        <p className="text-center text-sm text-red-600">
          Не удалось отправить. Позвоните нам: +374 91 446615
        </p>
      )}
      <p className="text-center text-xs text-muted">
        Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
      </p>
    </form>
  );
}
