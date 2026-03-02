"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to start checkout");
        setLoading(false);
      }
    } catch {
      toast.error("Failed to start checkout");
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleUpgrade} disabled={loading} className="w-full">
      {loading ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</>
      ) : (
        <>Upgrade — $199/mo <ArrowRight className="w-4 h-4 ml-2" /></>
      )}
    </Button>
  );
}
