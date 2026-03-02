import Link from "next/link";
import { Building2, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Try it out with one project",
    features: [
      "1 active project",
      "3 concept generations",
      "Room programming",
      "Compliance checklist",
      "View-only (no exports)",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: "$199",
    period: "/month",
    description: "For active design professionals",
    features: [
      "Unlimited projects",
      "Unlimited generations",
      "AI-powered generation",
      "Construction cost estimates",
      "Floor plans + MEP overlays",
      "DXF/CAD export",
      "PDF export",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For firms and multi-user teams",
    features: [
      "Everything in Professional",
      "Team collaboration",
      "Custom room templates",
      "API access",
      "SSO / SAML",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Archonek</span>
          </Link>
          <Link href="/login">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-stone-900 mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-stone-500">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? "border-stone-900 shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-900">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-stone-900">{plan.price}</span>
                    <span className="text-stone-500">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-stone-400">
          &copy; 2026 Archonek. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
