import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumino AI – Karriere-Coaching",
  description:
    "Trainiere schwierige Berufsgespräche mit KI. Vorstellungsgespräche, Gehaltsverhandlungen und Mitarbeitergespräche.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
