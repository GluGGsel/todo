import { prisma } from "@/lib/db";
import type { Assignee, Person, Priority } from "@/lib/types";

export const dynamic = "force-dynamic";

function parsePerson(v: string | null): Person {
  if (v === "MANN" || v === "FRAU") return v;
  return "MANN";
}

function mineAssignees(person: Person): Assignee[] {
  return person === "MANN" ? ["MANN", "BEIDE"] : ["FRAU", "BEIDE"];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const person = parsePerson(url.searchParams.get("person"));
  const scope = url.searchParams.get("scope") === "all" ? "all" : "mine";
  const tag = url.searchParams.get("tag"); // tagId or "untagged" or null

  const where: any = {};
  if (scope === "mine") {
    where.assignee = { in: mineAssignees(person) };
  }

  if (tag === "untagged") {
    where.tags = { none: {} };
  } else if (tag) {
    where.tags = { some: { tagId: tag } };
  }

  const todos = await prisma.todo.findMany({
    where,
    include: { tags: { include: { tag: true } } },
    orderBy: [{ done: "asc" }, { createdAt: "desc" }]
  });

  const dto = todos.map((t) => ({
    id: t.id,
    title: t.title,
    done: t.done,
    createdAt: t.createdAt.toISOString(),
    author: t.author,
    assignee: t.assignee,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    priority: t.priority,
    tags: t.tags.map((x) => ({ id: x.tag.id, name: x.tag.name }))
  }));

  return Response.json(dto);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    title: string;
    author: Person;
    assignee: Assignee;
    priority: Priority;
    deadline?: string | null;
    tagIds?: string[];
  };

  const title = (body.title || "").trim();
  if (!title) return new Response("Missing title", { status: 400 });

  const tagIds = Array.isArray(body.tagIds) ? body.tagIds : [];
  const deadline = body.deadline ? new Date(body.deadline) : null;

  const created = await prisma.todo.create({
    data: {
      title,
      author: body.author,
      assignee: body.assignee,
      priority: body.priority,
      deadline,
      tags: {
        create: tagIds.map((tagId) => ({ tagId }))
      }
    },
    include: { tags: { include: { tag: true } } }
  });

  return Response.json({
    id: created.id,
    title: created.title,
    done: created.done,
    createdAt: created.createdAt.toISOString(),
    author: created.author,
    assignee: created.assignee,
    deadline: created.deadline ? created.deadline.toISOString() : null,
    priority: created.priority,
    tags: created.tags.map((x) => ({ id: x.tag.id, name: x.tag.name }))
  });
}
