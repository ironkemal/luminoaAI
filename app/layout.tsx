import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import PinLockScreen from "@/components/PinLockScreen";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumino PT – Akıllı Kişisel Fitness & Antrenör Platformu",
  description:
    "100 kg Body Recomposition & Lean Cut takibi, 24.5 kg dambıl antrenman motoru ve AI PT karar mekanizması.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={jakarta.variable}>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <LanguageProvider>
          <PinLockScreen>
            <Navbar />
            <main className="w-full">{children}</main>
            <BottomNav />
          </PinLockScreen>
        </LanguageProvider>
      </body>
    </html>
  );
}
