import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "To-dos",
  description: "Selfhosted To-do Liste"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH">
      <body>{children}</body>
    </html>
  );
}
