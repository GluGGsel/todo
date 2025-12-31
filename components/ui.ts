import clsx from "clsx";

export function cx(...args: any[]) {
  return clsx(args);
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("de-CH", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function daysUntil(deadlineIso: string) {
  const now = new Date();
  const d = new Date(deadlineIso);
  const ms = d.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function recommendPriority(days: number): "A" | "B" | "C" {
  if (days <= 2) return "A";
  if (days <= 7) return "B";
  return "C";
}
