import Navbar from "@/components/Navbar";
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
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={fullName} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
