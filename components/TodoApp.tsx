"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Person, TagDto, TodoDto } from "@/lib/types";
import TagFilter from "@/components/TagFilter";
import TodoCreateForm from "@/components/TodoCreateForm";
import { cx, formatDate, formatDateTime, isToday } from "@/components/ui";

type Scope = "mine" | "all";

function prioClass(p: "A" | "B" | "C") {
  if (p === "A") return "bg-red-200 text-slate-900 dark:bg-red-900/60 dark:text-slate-100";
  if (p === "B") return "bg-amber-200 text-slate-900 dark:bg-amber-900/60 dark:text-slate-100";
  return "bg-emerald-200 text-slate-900 dark:bg-emerald-900/60 dark:text-slate-100";
}

function personLabel(p: Person) {
  return p === "MANN" ? "Mann" : "Frau";
}

type Activity = {
  id: string;
  createdAt: string;
  type: "ADDED" | "COMPLETED" | "REOPENED";
  actor: Person;
  title: string;
  todoId: string | null;
};

function activityText(a: Activity | null) {
  if (!a) return "Noch keine Aktivität. Entweder sehr ruhig oder der Server schläft noch.";
  const who = personLabel(a.actor);
  if (a.type === "ADDED") return `${who} hat „${a.title}“ hinzugefügt`;
  if (a.type === "COMPLETED") return `${who} hat „${a.title}“ erledigt`;
  return `${who} hat „${a.title}“ wieder geöffnet`;
}

export default function TodoApp(props: { person: Person; theme: "mann" | "frau" }) {
  const { person, theme } = props;

  const [tags, setTags] = useState<TagDto[]>([]);
  const [todos, setTodos] = useState<TodoDto[]>([]);
  const [completed, setCompleted] = useState<TodoDto[]>([]);
  const [scope, setScope] = useState<Scope>("mine");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [activity, setActivity] = useState<Activity | null>(null);
  const prevActivityId = useRef<string | null>(null);
  const [tickerFlash, setTickerFlash] = useState(false);

  const [doneOpen, setDoneOpen] = useState(false);

  // Undo toast state
  const [toast, setToast] = useState<null | {
    todoId: string;
    title: string;
    timeoutMs: number;
  }>(null);
  const toastTimer = useRef<any>(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pageBg = theme === "mann" ? "bg-blue-50 dark:bg-slate-950" : "bg-pink-50 dark:bg-slate-950";
  const headerBg =
    theme === "mann"
      ? "bg-blue-100/70 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900"
      : "bg-pink-100/70 border-pink-200 dark:bg-pink-950/40 dark:border-pink-900";

  async function loadAll() {
    setErr(null);
    setBusy(true);
    try {
      const [tagsRes, todosRes, doneRes, actRes] = await Promise.all([
        fetch("/api/tags", { cache: "no-store" }),
        fetch(
          `/api/todos?person=${person}&scope=${scope}&` +
            (activeTag ? `tag=${encodeURIComponent(activeTag)}` : ""),
          { cache: "no-store" }
        ),
        fetch("/api/completed", { cache: "no-store" }),
        fetch("/api/activity", { cache: "no-store" })
      ]);

      if (!tagsRes.ok) throw new Error(await tagsRes.text());
      if (!todosRes.ok) throw new Error(await todosRes.text());
      if (!doneRes.ok) throw new Error(await doneRes.text());
      if (!actRes.ok) throw new Error(await actRes.text());

      setTags(await tagsRes.json());
      setTodos(await todosRes.json());

      const doneList = (await doneRes.json()) as TodoDto[];
      setCompleted(doneList);

      const a = (await actRes.json()) as Activity | null;
      setActivity(a);

      // ticker animation if activity changed
      const nextId = a?.id ?? null;
      if (nextId && prevActivityId.current && nextId !== prevActivityId.current) {
        setTickerFlash(true);
        setTimeout(() => setTickerFlash(false), 800);
      }
      prevActivityId.current = nextId;
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    } finally {
      setBusy(false);
    }
  }

  // initial + reload on filters; ticker polling lightweight
  useEffect(() => {
    loadAll();
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/activity", { cache: "no-store" });
        if (!r.ok) return;
        const a = (await r.json()) as Activity | null;
        const nextId = a?.id ?? null;
        if (nextId && prevActivityId.current && nextId !== prevActivityId.current) {
          setActivity(a);
          setTickerFlash(true);
          setTimeout(() => setTickerFlash(false), 800);
        } else {
          setActivity(a);
        }
        prevActivityId.current = nextId;
      } catch {}
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, activeTag, person]);

  const counts = useMemo(() => {
    const open = todos.filter((t) => !t.done).length;
    const done = completed.length;
    return { open, done };
  }, [todos, completed]);

  function showUndoToast(todoId: string, title: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ todoId, title, timeoutMs: 6000 });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }

  async function setDone(id: string, done: boolean) {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done, actor: person })
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function toggleDone(id: string, done: boolean, title?: string) {
    try {
      await setDone(id, done);
      if (done) showUndoToast(id, title ?? "To-do");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    }
  }

  async function undoLast() {
    if (!toast) return;
    try {
      await setDone(toast.todoId, false);
      setToast(null);
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    }
  }

  const title = theme === "mann" ? "To-dos (Mann)" : "To-dos (Frau)";

  return (
    <main className={cx("min-h-screen", pageBg)}>
      <div className={cx("border-b", headerBg)}>
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Offen: {counts.open} · Erledigt (letzte 20): {counts.done}
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

          {/* Live ticker */}
          <div
            className={cx(
              "mt-3 text-sm italic text-slate-700 dark:text-slate-200 transition-all",
              tickerFlash ? "scale-[1.01] opacity-100" : "opacity-90"
            )}
          >
            Letzte Aktivität: {activityText(activity)}
            {activity?.createdAt ? ` · ${formatDateTime(new Date(activity.createdAt))}` : ""}
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

      {/* Undo toast */}
      {toast && (
        <div className="fixed left-0 right-0 bottom-4 z-50 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border shadow-sm px-4 py-3 bg-white/90 border-slate-200 dark:bg-slate-900/90 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-900 dark:text-slate-100">
                Erledigt: <span className="font-semibold">{toast.title}</span>
              </div>
              <button
                onClick={undoLast}
                className="px-3 py-2 rounded-xl border text-sm font-semibold bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
              >
                Undo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-3">
          {todos.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border shadow-sm p-4 bg-white/80 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={(e) => toggleDone(t.id, e.target.checked, t.title)}
                    className="mt-1 h-5 w-5"
                  />
                  <div>
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {t.title}
                    </div>
                    <div className="text-xs italic text-slate-600 dark:text-slate-300">
                      {personLabel(t.author)} · {formatDate(new Date(t.createdAt))}
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
              </div>
            </div>
          ))}

          {!busy && todos.length === 0 && (
            <div className="text-sm text-slate-600 dark:text-slate-300">Keine To-dos in dieser Ansicht.</div>
          )}
        </div>

        {/* Completed (collapsible) */}
        <div className="mt-8">
          <button
            onClick={() => setDoneOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 bg-white/70 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700"
          >
            <div className="text-left">
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Erledigt (letzte 20)</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {doneOpen ? "Einklappen" : "Ausklappen"}
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {completed.length} {doneOpen ? "▲" : "▼"}
            </div>
          </button>

          {doneOpen && (
            <div className="mt-3 flex flex-col gap-2">
              {completed.map((t) => {
                const doneAt = t.completedAt ? new Date(t.completedAt) : null;
                const today = doneAt ? isToday(doneAt) : false;

                return (
                  <div
                    key={t.id}
                    className="rounded-2xl border p-3 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {t.title}
                          </div>
                          {today && (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-200 text-slate-900 dark:bg-emerald-900/60 dark:text-slate-100">
                              Heute erledigt
                            </span>
                          )}
                        </div>

                        <div className="text-xs italic text-slate-600 dark:text-slate-300">
                          Erledigt von {t.completedBy ? personLabel(t.completedBy) : "?"}
                          {doneAt ? ` · ${formatDateTime(doneAt)}` : ""}
                        </div>
                      </div>

                      <button
                        className="px-3 py-1 rounded-xl border text-xs font-semibold bg-white/80 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700"
                        onClick={() => toggleDone(t.id, false, t.title)}
                      >
                        Reopen
                      </button>
                    </div>
                  </div>
                );
              })}

              {completed.length === 0 && (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Keine erledigten To-dos in den letzten 20. Entweder sehr effizient oder sehr optimistisch.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
