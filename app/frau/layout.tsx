import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "To-dos (Frau)",
  appleWebApp: { capable: true, title: "To-dos (Frau)", statusBarStyle: "default" },
  icons: { apple: [{ url: "/icons/frau/apple-touch-icon.png" }] }
};

export default function FrauLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
