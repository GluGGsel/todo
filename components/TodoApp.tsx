"use client";

import { useEffect, useMemo, useState } from "react";
import type { Person, TagDto, TodoDto } from "@/lib/types";
import TagFilter from "@/components/TagFilter";
import TodoCreateForm from "@/components/TodoCreateForm";
import { cx, formatDate } from "@/components/ui";

type Scope = "mine" | "all";

function prioClass(p: "A" | "B" | "C") {
  if (p === "A") return "bg-red-200 text-slate-900 dark:bg-red-900/60 dark:text-slate-100";
  if (p === "B") return "bg-amber-200 text-slate-900 dark:bg-amber-900/60 dark:text-slate-100";
  return "bg-emerald-200 text-slate-900 dark:bg-emerald-900/60 dark:text-slate-100";
}

export default function TodoApp(props: { person: Person; theme: "mann" | "frau" }) {
  const { person, theme } = props;

  const [tags, setTags] = useState<TagDto[]>([]);
  const [todos, setTodos] = useState<TodoDto[]>([]);
  const [scope, setScope] = useState<Scope>("mine");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pageBg =
    theme === "mann"
      ? "bg-blue-50 dark:bg-slate-950"
      : "bg-pink-50 dark:bg-slate-950";

  const headerBg =
    theme === "mann"
      ? "bg-blue-100/70 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900"
      : "bg-pink-100/70 border-pink-200 dark:bg-pink-950/40 dark:border-pink-900";

  async function loadAll() {
    setErr(null);
    setBusy(true);
    try {
      const [tagsRes, todosRes] = await Promise.all([
        fetch("/api/tags", { cache: "no-store" }),
        fetch(
          `/api/todos?person=${person}&scope=${scope}&` +
            (activeTag ? `tag=${encodeURIComponent(activeTag)}` : ""),
          { cache: "no-store" }
        )
      ]);

      if (!tagsRes.ok) throw new Error(await tagsRes.text());
      if (!todosRes.ok) throw new Error(await todosRes.text());

      setTags(await tagsRes.json());
      setTodos(await todosRes.json());
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, activeTag, person]);

  const title = theme === "mann" ? "To-dos (Mann)" : "To-dos (Frau)";

  const counts = useMemo(() => {
    const open = todos.filter((t) => !t.done).length;
    const done = todos.filter((t) => t.done).length;
    return { open, done };
  }, [todos]);

  async function toggleDone(id: string, done: boolean) {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done })
      });
      if (!res.ok) throw new Error(await res.text());
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    }
  }

  return (
    <main className={cx("min-h-screen", pageBg)}>
      <div className={cx("border-b", headerBg)}>
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Offen: {counts.open} · Erledigt: {counts.done}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className={cx(
                  "px-3 py-2 rounded-xl border shadow-sm text-sm font-semibold",
                  scope === "mine"
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                    : "bg-white/80 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700"
                )}
                onClick={() => setScope("mine")}
              >
                Meine
              </button>
              <button
                className={cx(
                  "px-3 py-2 rounded-xl border shadow-sm text-sm font-semibold",
                  scope === "all"
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                    : "bg-white/80 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700"
                )}
                onClick={() => setScope("all")}
              >
                Alle
              </button>
            </div>
          </div>

          <div className="mt-4">
            <TagFilter tags={tags} activeTag={activeTag} onChange={setActiveTag} theme={theme} />
          </div>

          <div className="mt-4">
            <TodoCreateForm person={person} theme={theme} tags={tags} onCreated={loadAll} />
          </div>

          {err && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{err}</div>}
          {busy && <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Lade…</div>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-3">
          {todos.map((t) => (
            <div
              key={t.id}
              className={cx(
                "rounded-2xl border shadow-sm p-4",
                "bg-white/80 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={(e) => toggleDone(t.id, e.target.checked)}
                    className="mt-1 h-5 w-5"
                  />
                  <div>
                    <div
                      className={cx(
                        "text-base font-semibold",
                        t.done
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-900 dark:text-slate-100"
                      )}
                    >
                      {t.title}
                    </div>
                    <div className="text-xs italic text-slate-600 dark:text-slate-300">
                      {t.author === "MANN" ? "Mann" : "Frau"} · {formatDate(new Date(t.createdAt))}
                    </div>
                  </div>
                </label>

                <div className="flex items-center gap-2">
                  <span className={cx("px-2 py-1 rounded-lg text-xs font-bold", prioClass(t.priority))}>
                    {t.priority}
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold border bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700">
                    {t.assignee === "BEIDE" ? "Beide" : t.assignee === "MANN" ? "Mann" : "Frau"}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {t.deadline ? (
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold border bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700">
                    Deadline: {formatDate(new Date(t.deadline))}
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-lg text-xs italic border bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700">
                    Keine Deadline
                  </span>
                )}

                {t.tags.length ? (
                  t.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 rounded-lg text-xs font-semibold border bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className="px-2 py-1 rounded-lg text-xs italic border bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700">
                    Untagged
                  </span>
                )}
              </div>
            </div>
          ))}

          {!busy && todos.length === 0 && (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Keine To-dos in dieser Ansicht.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
