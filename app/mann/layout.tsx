import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "To-dos (Mann)",
  appleWebApp: { capable: true, title: "To-dos (Mann)", statusBarStyle: "default" },
  icons: { apple: [{ url: "/icons/mann/apple-touch-icon.png" }] }
};

export default function MannLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
