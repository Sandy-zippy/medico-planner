import { createServiceClient } from "@/lib/supabase/service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function AccountPage() {
  const db = createServiceClient();

  const { count: projectCount } = await db
    .from("projects")
    .select("*", { count: "exact", head: true });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">Account</h1>
      <p className="text-sm text-stone-500 mb-8">Manage your account settings</p>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-stone-500">Email</p>
              <p className="text-sm text-stone-900">Guest</p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-stone-500">Projects</p>
              <p className="text-sm text-stone-900">{projectCount ?? 0} projects</p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-stone-500">Plan</p>
              <p className="text-sm text-stone-900">Starter (Free)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
