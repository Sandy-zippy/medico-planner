import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/components/layout/logout-button";
import { UpgradeButton } from "@/components/account/upgrade-button";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  const { count: generationCount } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .in("project_id", (await supabase.from("projects").select("id")).data?.map(p => p.id) ?? []);

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .eq("status", "active")
    .single();

  const plan = subscription?.plan ?? "starter";
  const isPro = plan === "professional";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">Account</h1>
      <p className="text-sm text-stone-500 mb-8">Manage your account and subscription</p>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
            <Badge variant={isPro ? "default" : "secondary"} className={isPro ? "bg-stone-900" : ""}>
              {isPro ? "Professional" : "Starter"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-stone-500">Email</p>
              <p className="text-sm text-stone-900">{user?.email}</p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-stone-500">Member since</p>
              <p className="text-sm text-stone-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
              </p>
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
              <p className="text-sm font-medium text-stone-500">Generations</p>
              <p className="text-sm text-stone-900">
                {generationCount ?? 0} {!isPro && "/ 3"}
              </p>
            </div>
          </div>
          {subscription?.current_period_end && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-stone-500">Renewal date</p>
                  <p className="text-sm text-stone-900">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!isPro && (
        <Card className="mt-6 border-stone-900">
          <CardHeader>
            <CardTitle>Upgrade to Professional</CardTitle>
            <CardDescription>
              Unlock AI-powered generation, construction cost estimates, and unlimited exports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpgradeButton />
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
