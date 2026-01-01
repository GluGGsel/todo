import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();

  const person = body.person;
  const sub = body.subscription;

  if (!person || (person !== "MANN" && person !== "FRAU")) {
    return new Response("Missing/invalid person", { status: 400 });
  }
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return new Response("Missing subscription", { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { person, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: { person, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth }
  });

  return Response.json({ ok: true });
}
