import webpush from "web-push";
import { prisma } from "@/lib/db";

let configured = false;

function ensureConfig() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY || "";
  const priv = process.env.VAPID_PRIVATE_KEY || "";
  const mail = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (pub && priv) {
    webpush.setVapidDetails(mail, pub, priv);
    configured = true;
  }
}

export async function notifyPerson(person: "MANN" | "FRAU", payload: any) {
  ensureConfig();
  if (!configured) return;

  const subs = await prisma.pushSubscription.findMany({ where: { person } });

  await Promise.all(
    subs.map(async (s) => {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth }
      };

      try {
        await webpush.sendNotification(subscription as any, JSON.stringify(payload));
      } catch (e: any) {
        // If endpoint is gone, clean up
        const code = e?.statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {});
        }
      }
    })
  );
}
