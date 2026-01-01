"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Person, TagDto, TodoDto } from "@/lib/types";
import TagFilter from "@/components/TagFilter";
import TodoCreateForm from "@/components/TodoCreateForm";
import { cx, formatDate, formatDateTime, isToday } from "@/components/ui";

type Scope = "mine" | "all";
type Activity = {
  id: string; createdAt: string; type: string; actor: Person; title: string; todoId: string | null;
};

function personLabel(p: Person) { return p === "MANN" ? "Mann" : "Frau"; }

function activityText(a: Activity | null) {
  if (!a) return "Noch keine Aktivität. Entweder sehr ruhig oder der Server ist beleidigt.";
  const who = personLabel(a.actor);
  if (a.type === "ADDED") return `${who} hat „${a.title}“ hinzugefügt`;
  if (a.type === "COMPLETED") return `${who} hat „${a.title}“ erledigt`;
  if (a.type === "REOPENED") return `${who} hat „${a.title}“ wieder geöffnet`;
  if (a.type === "PINNED") return `${who} hat „${a.title}“ gepinnt`;
  if (a.type === "UNPINNED") return `${who} hat „${a.title}“ entpinnt`;
  return `${who} hat „${a.title}“ bearbeitet`;
}

function prioClass(p: "A" | "B" | "C") {
  if (p === "A") return "bg-red-200 text-slate-900 dark:bg-red-900/60 dark:text-slate-100";
  if (p === "B") return "bg-amber-200 text-slate-900 dark:bg-amber-900/60 dark:text-slate-100";
  return "bg-emerald-200 text-slate-900 dark:bg-emerald-900/60 dark:text-slate-100";
}

function isOverdue(t: TodoDto) {
  if (!t.deadline || t.done) return false;
  const d = new Date(t.deadline);
  const now = new Date();
  // overdue if deadline is before today (ignoring time)
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nn = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return dd < nn;
}

async function registerPush(person: Person) {
  const keyRes = await fetch("/api/push/public-key", { cache: "no-store" });
  const { publicKey } = await keyRes.json();
  if (!publicKey) throw new Error("VAPID_PUBLIC_KEY fehlt (Server .env)");

  if (!("serviceWorker" in navigator)) throw new Error("Service Worker nicht verfügbar");

  const reg = await navigator.serviceWorker.register("/sw.js");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Benachrichtigungen abgelehnt");

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ person, subscription: sub })
  });
  if (!res.ok) throw new Error(await res.text());
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
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

  const [toast, setToast] = useState<null | { todoId: string; title: string }>(null);
  const toastTimer = useRef<any>(null);

  const [edit, setEdit] = useState<null | TodoDto>(null);
  const [pushErr, setPushErr] = useState<string | null>(null);

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
      setCompleted(await doneRes.json());

      const a = (await actRes.json()) as Activity | null;
      const nextId = a?.id ?? null;
      if (nextId && prevActivityId.current && nextId !== prevActivityId.current) {
        setTickerFlash(true);
        setTimeout(() => setTickerFlash(false), 800);
      }
      prevActivityId.current = nextId;
      setActivity(a);
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/activity", { cache: "no-store" });
        if (!r.ok) return;
        const a = (await r.json()) as Activity | null;
        const nextId = a?.id ?? null;
        if (nextId && prevActivityId.current && nextId !== prevActivityId.current) {
          setTickerFlash(true);
          setTimeout(() => setTickerFlash(false), 800);
        }
        prevActivityId.current = nextId;
        setActivity(a);
      } catch {}
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, activeTag, person]);

  const counts = useMemo(() => {
    const open = todos.filter((t) => !t.done).length;
    const done = completed.length;
    const overdue = todos.filter(isOverdue).length;
    return { open, done, overdue };
  }, [todos, completed]);

  const visibleTodos = useMemo(() => {
    // pinned first, then overdue, then rest by createdAt desc if available
    const copy = [...todos];
    copy.sort((a, b) => {
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;

      const ao = isOverdue(a) ? 1 : 0;
      const bo = isOverdue(b) ? 1 : 0;
      if (ao !== bo) return bo - ao;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return copy;
  }, [todos]);

  function showUndoToast(todoId: string, title: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ todoId, title });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }

  async function patchTodo(id: string, patch: any) {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...patch, actor: person })
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function toggleDone(id: string, done: boolean, title: string) {
    try {
      await patchTodo(id, { done });
      if (done) showUndoToast(id, title);
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    }
  }

  async function togglePinned(id: string, pinned: boolean) {
    try {
      await patchTodo(id, { pinned });
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    }
  }

  async function undoLast() {
    if (!toast) return;
    try {
      await patchTodo(toast.todoId, { done: false });
      setToast(null);
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    }
  }

  async function saveEdit() {
    if (!edit) return;
    try {
      await patchTodo(edit.id, {
        title: edit.title,
        assignee: edit.assignee,
        priority: edit.priority,
        deadline: edit.deadline
      });
      setEdit(null);
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    }
  }

  async function enablePush() {
    setPushErr(null);
    try {
      await registerPush(person);
    } catch (e: any) {
      setPushErr(e?.message ?? "Push-Fehler");
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
                Offen: {counts.open} · Überfällig:{" "}
                <span className={counts.overdue ? "font-bold text-red-700 dark:text-red-300" : ""}>
                  {counts.overdue}
                </span>{" "}
                · Erledigt (letzte 20): {counts.done}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
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

              <button
                onClick={enablePush}
                className="px-3 py-2 rounded-xl border text-xs font-semibold bg-white/80 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700"
                title="Push aktivieren"
              >
                Push aktivieren
              </button>
              {pushErr && <div className="text-xs text-red-600 dark:text-red-400">{pushErr}</div>}
            </div>
          </div>

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

      {/* Edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border shadow-sm bg-white dark:bg-slate-950 dark:border-slate-700 p-4">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">To-do bearbeiten</div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Titel</label>
              <input
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Zuweisung</label>
                <select
                  value={edit.assignee}
                  onChange={(e) => setEdit({ ...edit, assignee: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border px-2 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="MANN">Mann</option>
                  <option value="FRAU">Frau</option>
                  <option value="BEIDE">Beide</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prio</label>
                <select
                  value={edit.priority}
                  onChange={(e) => setEdit({ ...edit, priority: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border px-2 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Deadline</label>
                <input
                  type="date"
                  value={edit.deadline ? edit.deadline.slice(0, 10) : ""}
                  onChange={(e) =>
                    setEdit({ ...edit, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                  className="mt-1 w-full rounded-xl border px-2 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEdit(null)}
                className="px-3 py-2 rounded-xl border text-sm font-semibold bg-white/80 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700"
              >
                Abbrechen
              </button>
              <button
                onClick={saveEdit}
                className="px-3 py-2 rounded-xl border text-sm font-semibold bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Empty state */}
        {!busy && visibleTodos.length === 0 && (
          <div className="rounded-2xl border p-6 bg-white/70 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            <div className="text-lg font-bold">Keine To-dos.</div>
            <div className="mt-1 text-sm italic">
              Entweder seid ihr top organisiert – oder ihr habt schlicht aufgegeben. Beides ist möglich.
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {visibleTodos.map((t) => {
            const overdue = isOverdue(t);

            return (
              <div
                key={t.id}
                className={cx(
                  "rounded-2xl border shadow-sm p-4 bg-white/80 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700",
                  overdue ? "ring-2 ring-red-400/60 dark:ring-red-500/50" : "",
                  t.pinned ? "ring-2 ring-slate-900/10 dark:ring-white/10" : ""
                )}
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
                        {overdue ? " · ÜBERFÄLLIG" : ""}
                      </div>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePinned(t.id, !t.pinned)}
                      className="px-2 py-1 rounded-lg text-xs font-bold border bg-white/70 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700"
                      title="Pin"
                    >
                      {t.pinned ? "★" : "☆"}
                    </button>

                    <button
                      onClick={() => setEdit(t)}
                      className="px-2 py-1 rounded-lg text-xs font-bold border bg-white/70 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700"
                      title="Bearbeiten"
                    >
                      Edit
                    </button>

                    <span className={cx("px-2 py-1 rounded-lg text-xs font-bold", prioClass(t.priority))}>
                      {t.priority}
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

                  <span className="px-2 py-1 rounded-lg text-xs font-semibold border bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700">
                    {t.assignee === "BEIDE" ? "Beide" : t.assignee === "MANN" ? "Mann" : "Frau"}
                  </span>
                </div>
              </div>
            );
          })}
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
                  Keine erledigten To-dos. Tragisch – wir können nichts feiern.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
