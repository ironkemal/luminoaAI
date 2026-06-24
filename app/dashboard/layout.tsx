import Navbar from "@/components/Navbar";
import CoachChat from "@/components/CoachChat";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name ?? null;

  return (
    <div className="min-h-screen" style={{ background: "#EEF2FF" }}>
      <Navbar userName={fullName} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      <CoachChat />
    </div>
  );
}
