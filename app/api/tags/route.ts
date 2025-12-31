import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return Response.json(tags);
}
