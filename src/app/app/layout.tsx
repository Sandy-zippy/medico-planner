import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // TEMP: bypass disabled for local dev review
  // if (!user) {
  //   redirect("/login");
  // }

  return (
    <div className="min-h-screen bg-stone-50">
      <AppNav email={user?.email ?? "dev@local"} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
