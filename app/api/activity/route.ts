import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await prisma.activity.findFirst({ orderBy: { createdAt: "desc" } });
  return Response.json(a ?? null);
}
