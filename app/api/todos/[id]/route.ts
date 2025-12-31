import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  const body = (await req.json()) as Partial<{
    done: boolean;
    title: string;
    assignee: "MANN" | "FRAU" | "BEIDE";
    priority: "A" | "B" | "C";
    deadline: string | null;
    tagIds: string[];
  }>;

  const data: any = {};

  if (typeof body.done === "boolean") data.done = body.done;
  if (typeof body.title === "string") data.title = body.title.trim();
  if (body.assignee) data.assignee = body.assignee;
  if (body.priority) data.priority = body.priority;
  if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null;

  const tagIds = Array.isArray(body.tagIds) ? body.tagIds : null;

  const updated = await prisma.todo.update({
    where: { id },
    data: {
      ...data,
      ...(tagIds
        ? {
            tags: {
              deleteMany: {},
              create: tagIds.map((tagId) => ({ tagId }))
            }
          }
        : {})
    },
    include: { tags: { include: { tag: true } } }
  });

  return Response.json({
    id: updated.id,
    title: updated.title,
    done: updated.done,
    createdAt: updated.createdAt.toISOString(),
    author: updated.author,
    assignee: updated.assignee,
    deadline: updated.deadline ? updated.deadline.toISOString() : null,
    priority: updated.priority,
    tags: updated.tags.map((x) => ({ id: x.tag.id, name: x.tag.name }))
  });
}
