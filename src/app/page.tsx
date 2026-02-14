import Link from "next/link";
import { Building2, Shield, Zap, FileText, ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Building2,
    title: "Room Programming",
    description: "Intelligent room layouts tailored to your clinic type — dental, optometry, veterinary, and more.",
  },
  {
    icon: Shield,
    title: "Code Compliance",
    description: "Automatic compliance checks against NBC, OBC, BCBC, and provincial building codes.",
  },
  {
    icon: Zap,
    title: "Instant Concept Packages",
    description: "Generate comprehensive space plans with room programs, adjacencies, and risk analysis in seconds.",
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
    icon: CheckCircle2,
    title: "Upload & Analyze",
    description: "Upload existing floor plans and let Medico Planner analyze your current space.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Medico Planner</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-600 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Built for Canadian healthcare practices
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Clinic space planning,<br />
            <span className="text-slate-400">simplified.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            From room programming to code compliance — generate professional concept packages
            for dental clinics, veterinary practices, pharmacies, and more.
            Tailored to Canadian building codes.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="text-base px-8 h-12">
                Start Planning <ArrowRight className="w-4 h-4 ml-2" />
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
      <section className="border-y border-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm text-slate-400">
          <span>12 Clinic Types</span>
          <span className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full" />
          <span>10 Provinces</span>
          <span className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full" />
          <span>NBC / OBC / BCBC</span>
          <span className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full" />
          <span>Instant Output</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
              Everything you need to plan your clinic
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Professional-grade space planning tools built specifically for Canadian healthcare and commercial spaces.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-16 text-center">
            Three steps to your concept package
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Define Your Project', desc: 'Select clinic type, enter area, choose province, and customize your room requirements.' },
              { step: '02', title: 'Upload Plans (Optional)', desc: 'Upload existing floor plans or lease drawings for analysis and reference.' },
              { step: '03', title: 'Generate & Iterate', desc: 'Get a full concept package — room program, compliance checklist, adjacencies, and risk analysis.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl font-bold text-slate-200 mb-4">{item.step}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Ready to plan your clinic?
          </h2>
          <p className="text-slate-500 mb-8">
            Start with a free project. No credit card required.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-base px-8 h-12">
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
              <Building2 className="w-3 h-3 text-white" />
            </div>
            <span>Medico Planner</span>
          </div>
          <span>&copy; 2026 Medico Planner. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
