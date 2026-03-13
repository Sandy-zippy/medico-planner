import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <AppNav email="Guest" />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
