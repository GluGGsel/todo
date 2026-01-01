import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: any) {
  const { done, actor } = await req.json();
  const now = new Date();

  const todo = await prisma.todo.update({
    where: { id: params.id },
    data: done
      ? { done: true, completedAt: now, completedBy: actor }
      : { done: false, completedAt: null, completedBy: null }
  });

  await prisma.activity.create({
    data: {
      type: done ? "COMPLETED" : "REOPENED",
      actor,
      todoId: todo.id,
      title: todo.title
    }
  });

  return Response.json(todo);
}
