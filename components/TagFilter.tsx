"use client";

import { cx } from "@/components/ui";
import type { TagDto } from "@/lib/types";

export default function TagFilter(props: {
  tags: TagDto[];
  activeTag: string | null; // null => Alle, "untagged" => untagged, else tagId
  onChange: (tag: string | null) => void;
  theme: "mann" | "frau";
}) {
  const { tags, activeTag, onChange, theme } = props;

  const baseTile =
    "px-3 py-2 rounded-xl text-sm font-medium border shadow-sm select-none cursor-pointer";
  const themeTile =
    theme === "mann"
      ? "bg-blue-100 border-blue-200 text-slate-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-slate-100"
      : "bg-pink-100 border-pink-200 text-slate-900 dark:bg-pink-950/40 dark:border-pink-900 dark:text-slate-100";

  const activeRing = "ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-500";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={cx(baseTile, themeTile, activeTag === null && activeRing)}
        onClick={() => onChange(null)}
      >
        Alle
      </button>
      <button
        className={cx(baseTile, themeTile, activeTag === "untagged" && activeRing)}
        onClick={() => onChange("untagged")}
      >
        Untagged
      </button>
      {tags.map((t) => (
        <button
          key={t.id}
          className={cx(baseTile, themeTile, activeTag === t.id && activeRing)}
          onClick={() => onChange(t.id)}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
