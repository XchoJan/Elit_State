"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Ничего не рисует — только фиксирует источник первого визита (utm-метки,
 * fbclid/gclid, реферер), чтобы он доехал до заявки. Монтируется в layout,
 * поэтому срабатывает на любой посадочной странице.
 */
export default function Attribution() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
