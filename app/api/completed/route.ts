import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.todo.findMany({
    where: { done: true, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 20
  });
  return Response.json(items);
}
