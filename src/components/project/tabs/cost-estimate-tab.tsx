"use client";

import { Badge } from "@/components/ui/badge";
import type { CostEstimate } from "@/types";

export function CostEstimateTab({ estimate }: { estimate: CostEstimate }) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

  // Group line items by category
  const grouped = estimate.line_items.reduce<Record<string, typeof estimate.line_items>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            {category}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-stone-500">
                  <th className="text-left py-1.5 font-medium">Description</th>
                  <th className="text-right py-1.5 font-medium w-16">Qty</th>
                  <th className="text-right py-1.5 font-medium w-12">Unit</th>
                  <th className="text-right py-1.5 font-medium w-20">Rate</th>
                  <th className="text-right py-1.5 font-medium w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-stone-50">
                    <td className="py-1.5 text-stone-700">{item.description}</td>
                    <td className="py-1.5 text-right text-stone-500">
                      {item.unit === "LS" ? "—" : item.quantity.toLocaleString()}
                    </td>
                    <td className="py-1.5 text-right text-stone-500">{item.unit}</td>
                    <td className="py-1.5 text-right text-stone-500">{formatCurrency(item.unit_cost)}</td>
                    <td className="py-1.5 text-right font-medium text-stone-700">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="border-t border-stone-200 pt-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-stone-500">Subtotal</span>
          <span className="font-medium text-stone-700">{formatCurrency(estimate.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-stone-500">Contingency ({estimate.contingency_percent}%)</span>
          <span className="font-medium text-stone-700">{formatCurrency(estimate.contingency_amount)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold border-t border-stone-200 pt-2">
          <span className="text-stone-900">Estimated Total</span>
          <span className="text-stone-900">{formatCurrency(estimate.total)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-stone-500">Cost per SF</span>
          <Badge variant="secondary" className="text-[10px] bg-stone-100">
            {formatCurrency(estimate.cost_per_sqft)}/SF
          </Badge>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-stone-400 leading-relaxed border-t border-stone-100 pt-3">
        {estimate.disclaimer}
      </p>
    </div>
  );
}
