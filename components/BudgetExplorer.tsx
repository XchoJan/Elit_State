"use client";

import { useState } from "react";
import {
  BUDGET_STEPS,
  cities,
  STATS_DISCLAIMER,
  tierForBudget,
  type CitySlug,
} from "@/lib/data";
import type { QuizPrefill } from "@/components/Quiz";

// Главная приманка страницы: человек двигает одну сумму и сразу видит, что
// она даёт во всех четырёх странах. Это единственное, что мы умеем показать
// без реальных карточек объектов, и это же наш аргумент — сравнение рынков
// в одном окне. Клик по стране уносит ответ прямо в квиз.

export default function BudgetExplorer() {
  const [idx, setIdx] = useState(3); // $150 000 — самый частый вход
  const step = BUDGET_STEPS[idx];

  function pickCity(slug: CitySlug) {
    const city = cities.find((c) => c.slug === slug);
    if (!city) return;
    const detail: QuizPrefill = {
      city: city.country ? `${city.name} (${city.country})` : city.name,
      budget: `≈ ${step.label}`,
    };
    window.dispatchEvent(new CustomEvent("quiz:prefill", { detail }));
    document.getElementById("podbor")?.scrollIntoView({ block: "center" });
  }

  return (
    <div className="rounded-3xl border border-line bg-card p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label
            htmlFor="budget-range"
            className="text-sm font-semibold text-muted"
          >
            Ваш бюджет на покупку
          </label>
          <p className="font-display text-4xl font-bold text-brand sm:text-5xl">
            {step.label}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-muted sm:max-w-xs sm:text-right">
          Двигайте ползунок — увидите, что эта сумма даёт в каждой из четырёх
          стран.
        </p>
      </div>

      <input
        id="budget-range"
        type="range"
        min={0}
        max={BUDGET_STEPS.length - 1}
        step={1}
        value={idx}
        onChange={(e) => setIdx(Number(e.target.value))}
        aria-valuetext={step.label}
        className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent outline-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-accent"
      />
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{BUDGET_STEPS[0].label}</span>
        <span>{BUDGET_STEPS[BUDGET_STEPS.length - 1].label}</span>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cities.map((c) => {
          const tier = tierForBudget(c.slug, step.usd);
          // Нулевой уровень Дубая — честное «сюда пока не проходите».
          const outOfRange = tier.minUsd === 0 && c.slug === "dubai";
          return (
            <button
              key={c.slug}
              onClick={() => pickCity(c.slug)}
              className={`flex flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                outOfRange
                  ? "border-line bg-background opacity-70 hover:opacity-100"
                  : "border-line bg-white hover:border-accent"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{c.countryFlag}</span>
                <span className="text-sm font-bold text-brand">{c.name}</span>
              </span>
              <span className="mt-3 block text-base font-bold leading-snug text-brand">
                {tier.what}
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-muted">
                {tier.where}
              </span>
              <span className="mt-3 block border-t border-line pt-3 text-xs leading-relaxed text-accent-dark">
                {tier.note}
              </span>
              <span className="mt-3 block text-xs font-semibold text-accent">
                Подобрать здесь →
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted">{STATS_DISCLAIMER}</p>
    </div>
  );
}
