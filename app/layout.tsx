import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumino AI – Karriere-Coaching",
  description:
    "Trainiere schwierige Berufsgespräche mit KI. Vorstellungsgespräche, Gehaltsverhandlungen und Mitarbeitergespräche.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
