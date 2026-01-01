import { prisma } from "@/lib/db";
import { notifyPerson } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: any) {
  const id = params.id;
  const body = await req.json();

  const actor = body.actor;
  if (!actor || (actor !== "MANN" && actor !== "FRAU")) {
    return new Response("Missing actor", { status: 400 });
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.todo.findUnique({ where: { id } });
    if (!current) throw new Error("Not found");

    // Supported patch fields
    const data: any = {};
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.pinned === "boolean") data.pinned = body.pinned;
    if (typeof body.assignee === "string") data.assignee = body.assignee;
    if (typeof body.priority === "string") data.priority = body.priority;
    if (body.deadline === null) data.deadline = null;
    if (typeof body.deadline === "string") data.deadline = new Date(body.deadline);

    // done toggle
    if (typeof body.done === "boolean") {
      if (body.done) {
        data.done = true;
        data.completedAt = now;
        data.completedBy = actor;
      } else {
        data.done = false;
        data.completedAt = null;
        data.completedBy = null;
      }
    }

    const todo = await tx.todo.update({ where: { id }, data });

    // Activity type
    let type: any = "EDITED";
    if (typeof body.done === "boolean") type = body.done ? "COMPLETED" : "REOPENED";
    else if (typeof body.pinned === "boolean") type = body.pinned ? "PINNED" : "UNPINNED";

    await tx.activity.create({
      data: { type, actor, todoId: todo.id, title: todo.title }
    });

    return todo;
  });

  // Notifications (minimal: notify the other person on add/complete/edit)
  const other = actor === "MANN" ? "FRAU" : "MANN";
  const url = other === "MANN" ? "/mann" : "/frau";

  const msg =
    typeof body.done === "boolean"
      ? body.done
        ? `${actor} hat „${updated.title}“ erledigt`
        : `${actor} hat „${updated.title}“ wieder geöffnet`
      : typeof body.pinned === "boolean"
        ? `${actor} hat „${updated.title}“ ${body.pinned ? "gepinnt" : "entpinnt"}`
        : `${actor} hat „${updated.title}“ bearbeitet`;

  await notifyPerson(other, { title: "To-do", body: msg, url });

  return Response.json(updated);
}
