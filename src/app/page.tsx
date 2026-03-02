import Link from "next/link";
import { Building2, Shield, Zap, FileText, ArrowRight, DollarSign, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Building2,
    title: "Room Schedules",
    description: "Detailed room-by-room schedules with areas, finishes, and equipment — ready for your drawing set.",
  },
  {
    icon: Shield,
    title: "Code Compliance",
    description: "Automatic compliance checks against NBC, OBC, BCBC, and provincial building codes.",
  },
  {
    icon: Zap,
    title: "Instant Concept Packages",
    description: "Generate comprehensive construction documents with room programs, code analysis, and risk assessment in seconds.",
  },
  {
    icon: FileText,
    title: "Version History",
    description: "Iterate on your designs. Every generation is versioned so you can compare and refine.",
  },
  {
    icon: MapPin,
    title: "Province-Specific",
    description: "Built for Canada. Tailored code references for Ontario, BC, Alberta, Quebec, and all provinces.",
  },
  {
    icon: DollarSign,
    title: "Cost Estimation",
    description: "Province-specific construction cost estimates with line items, contingencies, and per-square-foot breakdowns.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Archonek</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">Log In</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-sm text-stone-600 mb-8">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            Built for Canadian construction professionals
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-stone-900 leading-[1.1] mb-6">
            Code-compliant clinic concept<br />
            packages, <span className="text-stone-400 italic">instantly.</span>
          </h1>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            From room schedules to construction cost estimates — generate professional concept packages
            for dental, medical, veterinary, and optometry clinics across Canada.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="text-base px-8 h-12">
                Start Your Project <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-y border-stone-100 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm text-stone-400">
          <span>6 Clinic Types</span>
          <span className="hidden sm:block w-1 h-1 bg-stone-300 rounded-full" />
          <span>10 Provinces</span>
          <span className="hidden sm:block w-1 h-1 bg-stone-300 rounded-full" />
          <span>NBC / OBC / BCBC</span>
          <span className="hidden sm:block w-1 h-1 bg-stone-300 rounded-full" />
          <span>Cost Estimates</span>
          <span className="hidden sm:block w-1 h-1 bg-stone-300 rounded-full" />
          <span>AI-Powered</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-stone-900 mb-4">
              Everything you need to document your project
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto">
              Professional-grade construction document tools built specifically for Canadian healthcare design professionals.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-stone-50 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-stone-700" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-stone-900 mb-16 text-center">
            Three steps to your concept package
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Define Your Project', desc: 'Select space type, enter area, choose province, and customize your room requirements.' },
              { step: '02', title: 'Upload Plans (Optional)', desc: 'Upload existing floor plans or lease drawings for analysis and reference.' },
              { step: '03', title: 'Generate & Iterate', desc: 'Get a full concept package — floor plans, cost estimates, and MEP layouts with compliance analysis.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl font-bold text-stone-200 mb-4">{item.step}</div>
                <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-stone-900 mb-4">
            Ready to start your next project?
          </h2>
          <p className="text-stone-500 mb-8">
            Start with a free clinic project. No credit card required.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-base px-8 h-12">
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-stone-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-stone-900 rounded flex items-center justify-center">
              <Building2 className="w-3 h-3 text-amber-400" />
            </div>
            <span>Archonek</span>
          </div>
          <span>&copy; 2026 Archonek. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
