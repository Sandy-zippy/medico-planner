"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        setError("Too many attempts. Please wait 60 seconds before trying again.");
        setCooldown(60);
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      setSent(true);
      setCooldown(60);
      setLoading(false);
    }
  }, [email, cooldown]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-semibold text-xl tracking-tight">UNC Architect</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{sent ? "Check your email" : "Welcome back"}</CardTitle>
            <CardDescription>
              {sent
                ? `We sent a magic link to ${email}`
                : "Sign in with your email to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-stone-600" />
                  </div>
                </div>
                <p className="text-sm text-center text-stone-500">
                  Click the link in your email to sign in. If you don&apos;t see it, check your spam folder.
                </p>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setSent(false); setEmail(""); }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Try a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading || cooldown > 0}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending link...</>
                  ) : cooldown > 0 ? (
                    `Wait ${cooldown}s`
                  ) : (
                    "Send Magic Link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-stone-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
