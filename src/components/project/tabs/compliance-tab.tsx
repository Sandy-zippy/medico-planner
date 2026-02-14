"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Shield } from "lucide-react";
import type { ComplianceItem, CodeAnalysis } from "@/types";

const statusIcons: Record<string, React.ReactNode> = {
  met: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  review: <AlertCircle className="w-4 h-4 text-amber-500" />,
  action_required: <XCircle className="w-4 h-4 text-red-500" />,
};

const statusColors: Record<string, string> = {
  met: "bg-emerald-50 text-emerald-700",
  review: "bg-amber-50 text-amber-700",
  action_required: "bg-red-50 text-red-700",
};

export function ComplianceTab({ items, codeAnalysis }: {
  items: ComplianceItem[];
  codeAnalysis: CodeAnalysis;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Compliance Checklist
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Met</span>
              <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Review</span>
              <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /> Action</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-stone-100">
                <div className="mt-0.5">{statusIcons[item.status]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{item.category}</span>
                    <Badge variant="secondary" className={statusColors[item.status]}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-stone-600">{item.requirement}</p>
                  <p className="text-xs text-stone-400 mt-1">Ref: {item.code_reference}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-stone-500">Code Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Classification</span>
            <span className="font-medium">{codeAnalysis.occupancy_classification}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Construction Type</span>
            <span className="font-medium">{codeAnalysis.construction_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Fire Rating</span>
            <span className="font-medium">{codeAnalysis.fire_rating}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Sprinkler Required</span>
            <span className="font-medium">{codeAnalysis.sprinkler_required ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Barrier-Free</span>
            <span className="font-medium">{codeAnalysis.barrier_free_required ? "Required" : "Not Required"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
