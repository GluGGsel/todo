"use client";

import { useMemo, useState } from "react";
import type { Assignee, Person, Priority, TagDto } from "@/lib/types";
import { cx, daysUntil, recommendPriority } from "@/components/ui";

export default function TodoCreateForm(props: {
  person: Person;
  theme: "mann" | "frau";
  tags: TagDto[];
  onCreated: () => void;
}) {
  const { person, theme, tags, onCreated } = props;

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState<Assignee>(person === "MANN" ? "MANN" : "FRAU");
  const [priority, setPriority] = useState<Priority>("B");
  const [deadline, setDeadline] = useState<string>(""); // yyyy-mm-dd
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const recommendation = useMemo(() => {
    if (!deadline) return null;
    const iso = new Date(deadline + "T00:00:00").toISOString();
    const d = daysUntil(iso);
    const rec = recommendPriority(d);
    return { days: d, rec };
  }, [deadline]);

  async function submit() {
    setErr(null);
    const t = title.trim();
    if (!t) {
      setErr("Titel fehlt.");
      return;
    }

    setBusy(true);
    try {
      const deadlineIso = deadline ? new Date(deadline + "T00:00:00").toISOString() : null;

      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: t,
          author: person,
          assignee,
          priority,
          deadline: deadlineIso,
          tagIds
        })
      });

      if (!res.ok) throw new Error(await res.text());

      setTitle("");
      setAssignee(person === "MANN" ? "MANN" : "FRAU");
      setPriority("B");
      setDeadline("");
      setTagIds([]);
      onCreated();
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    } finally {
      setBusy(false);
    }
  }

  const panel =
    theme === "mann"
      ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
      : "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-900";

  return (
    <div className={cx("border rounded-2xl p-4 shadow-sm", panel)}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Neues To-do</label>
          <input
            className="border rounded-xl px-3 py-2 bg-white/80 dark:bg-slate-900/50"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Versicherung anrufen"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Zuweisung</label>
            <select
              className="border rounded-xl px-3 py-2 bg-white/80 dark:bg-slate-900/50"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value as Assignee)}
            >
              <option value="MANN">Mann</option>
              <option value="FRAU">Frau</option>
              <option value="BEIDE">Beide</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Priorität</label>
            <select
              className="border rounded-xl px-3 py-2 bg-white/80 dark:bg-slate-900/50"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="A">A (≤ 2 Tage)</option>
              <option value="B">B (≤ 7 Tage)</option>
              <option value="C">C (≤ 30 Tage)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Deadline (optional)</label>
            <input
              type="date"
              className="border rounded-xl px-3 py-2 bg-white/80 dark:bg-slate-900/50"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        {recommendation && (
          <div className="text-sm italic text-slate-600 dark:text-slate-300">
            Deadline in {recommendation.days} Tag(en) → {recommendation.rec} empfohlen
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold">Tags (mehrere möglich)</div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => {
              const active = tagIds.includes(t.id);
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() =>
                    setTagIds((prev) =>
                      prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                    )
                  }
                  className={cx(
                    "px-3 py-2 rounded-xl border text-sm shadow-sm",
                    active
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                      : "bg-white/80 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700"
                  )}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        {err && <div className="text-sm text-red-600 dark:text-red-400">{err}</div>}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className={cx(
              "px-4 py-2 rounded-xl font-semibold shadow-sm border",
              busy
                ? "opacity-60 cursor-not-allowed"
                : "hover:shadow-md transition-shadow",
              theme === "mann"
                ? "bg-blue-200 border-blue-300 text-slate-900 dark:bg-blue-900/60 dark:border-blue-800 dark:text-slate-100"
                : "bg-pink-200 border-pink-300 text-slate-900 dark:bg-pink-900/60 dark:border-pink-800 dark:text-slate-100"
            )}
          >
            {busy ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
