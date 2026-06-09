import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass,
  ShieldCheck,
  MapPin,
  Route as RouteIcon,
  Users,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
} from "lucide-react";
import dcLogo from "@/assets/disaster-compass-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "DisasterCompass — Calm decisions in the first 60 minutes" },
      {
        name: "description",
        content:
          "DisasterCompass turns flood, fire, and storm signals into one clear action plan — safest route, who needs help, and what to do next.",
      },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1a2e] text-white antialiased">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#2a3b55] opacity-40 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#16A34A] opacity-10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="relative">
        {/* NAV */}
        <header className="flex w-full items-center justify-between bg-white px-6 py-4">
          <Link to="/" className="flex items-center">
            <img
              src={dcLogo.url}
              alt="DisasterCompass — Community Disaster Action Planner"
              className="h-10 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#trust" className="hover:text-slate-900">Trust</a>
          </nav>
          <Link
            to="/compass"
            className="group inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110"
          >
            Open Live Demo
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </header>

        {/* HERO */}
        <section className="mx-auto max-w-7xl px-6 pt-12 pb-24 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16A34A]" />
                </span>
                Live in North Creek — Flood Scenario Active
              </div>

              <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Calm decisions in the first{" "}
                <span className="bg-gradient-to-r from-[#16A34A] to-[#5EE6A1] bg-clip-text text-transparent">
                  60 minutes
                </span>
                .
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                When the warning hits, families freeze. DisasterCompass turns
                community signals into one clear plan — the safest route, who
                needs help, and exactly what to do next.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/compass"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(22,163,74,0.7)] transition hover:brightness-110"
                >
                  See the Compass Plan
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
                >
                  How it works
                </a>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-white/50">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A]" />
                  FEMA-aligned guidance
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
                  Open scoring formula
                </span>
                <span className="inline-flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-[#16A34A]" />
                  Rules-based, not a black box
                </span>
              </div>
            </div>

            {/* Compass card preview */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#16A34A]/20 to-transparent blur-2xl" />
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#2a3b55]/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-300 ring-1 ring-red-500/30">
                      <AlertTriangle className="h-3 w-3" />
                      Flood Warning
                    </span>
                    <span className="text-[11px] text-white/50">Demo · North Creek</span>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Recommended action</p>
                    <h3 className="mt-2 text-3xl font-bold leading-tight">
                      Go to higher ground
                    </h3>
                    <p className="mt-1 text-sm text-white/60">
                      Hilltop Community Center · 3.0 mi · ETA 35 min
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#16A34A] px-3 text-xs font-bold text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      GO — Route B
                    </span>
                    <span className="inline-flex h-9 items-center rounded-lg bg-white/10 px-3 text-xs font-medium text-white/80 ring-1 ring-white/10">
                      Route A rejected (flooded bridge)
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                    {[
                      { label: "Route B Score", value: "91", tone: "text-[#5EE6A1]" },
                      { label: "Households", value: "5", tone: "text-white" },
                      { label: "Need Help", value: "2", tone: "text-amber-300" },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-[10px] uppercase tracking-wider text-white/40">
                          {s.label}
                        </p>
                        <p className={`mt-1 text-2xl font-bold ${s.tone}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
            {[
              { v: "3", l: "Routes scored" },
              { v: "5", l: "Households tracked" },
              { v: "3", l: "Volunteers on call" },
              { v: "1", l: "Recommended action" },
            ].map((s) => (
              <div key={s.l} className="bg-[#0f1a2e] px-6 py-8 text-center">
                <p className="text-3xl font-bold tracking-tight text-white">{s.v}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/40">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-28">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-[#16A34A]">The system</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              One plan. Six panels. Zero guesswork.
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Every panel answers a question a panicked family is already
              asking. Nothing more.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#16A34A]/15 ring-1 ring-[#16A34A]/30">
                  <f.icon className="h-5 w-5 text-[#16A34A]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="border-t border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-6 py-28">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#16A34A]">The flow</p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                  From signal to safety in three steps.
                </h2>
                <p className="mt-4 text-white/60">
                  Built for the worst day, by people who've worked it.
                </p>
              </div>
              <div className="lg:col-span-8">
                <ol className="space-y-5">
                  {steps.map((s, i) => (
                    <li
                      key={s.title}
                      className="relative flex gap-5 rounded-2xl border border-white/10 bg-[#2a3b55]/50 p-6 backdrop-blur"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#16A34A] text-lg font-bold text-white shadow-lg shadow-[#16A34A]/30">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/60">{s.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section id="trust" className="mx-auto max-w-7xl px-6 py-28">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2a3b55] to-[#1a2540] p-10 sm:p-16">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#16A34A]">
                  AI you can audit
                </p>
                <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
                  Every recommendation shows its work.
                </h2>
                <p className="mt-4 text-white/60">
                  Click any route, score, or alert to see the exact signals,
                  weights, and sources behind the call. No black boxes when
                  it's your family.
                </p>
              </div>
              <div className="space-y-3">
                {disclosures.map((d) => (
                  <div
                    key={d}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />
                    <span className="text-sm text-white/85">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-32">
          <div className="relative overflow-hidden rounded-3xl border border-[#16A34A]/30 bg-[#16A34A]/[0.06] p-12 text-center sm:p-20">
            <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(22,163,74,0.18),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                See it before you need it.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/70">
                Open the live North Creek demo and walk through the first 60
                minutes of a flood event.
              </p>
              <Link
                to="/compass"
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-[#1e293b] shadow-2xl shadow-black/40 transition hover:bg-white/90"
              >
                Launch Compass Plan
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-white/40 sm:flex-row">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#16A34A]" />
              <span>DisasterCompass · North Creek Demo · 2026</span>
            </div>
            <span>For demonstration only. Not an official emergency service.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

const features = [
  {
    icon: Compass,
    title: "Compass Plan",
    desc: "One screen, one action. The most important thing to do, right now, in plain language.",
  },
  {
    icon: MapPin,
    title: "Safe Route Map",
    desc: "Live flood, fire, and blocked-road layers. Color-coded routes you can trust at a glance.",
  },
  {
    icon: RouteIcon,
    title: "Route Scores",
    desc: "Every path scored on safety, time, and elevation — with the math shown openly.",
  },
  {
    icon: Users,
    title: "Volunteer Match",
    desc: "Neighbors with capacity matched to neighbors who need transport, medicine, or eyes-on.",
  },
  {
    icon: ShieldCheck,
    title: "Coordinator View",
    desc: "A calm operations layer for block captains and emergency staff — shared, not siloed.",
  },
  {
    icon: Sparkles,
    title: "AI Disclosure",
    desc: "Every signal source, model weight, and fallback shown inline. Trust by construction.",
  },
];

const steps = [
  {
    title: "Signals come in.",
    desc: "Weather APIs, sensors, and community reports flow into one normalized stream — verified, deduped, geolocated.",
  },
  {
    title: "The Compass decides.",
    desc: "We weigh hazard severity, route safety, household needs, and shelter capacity into a single recommended action.",
  },
  {
    title: "Your family moves.",
    desc: "One clear instruction, one mapped route, one tap to coordinate with neighbors. No dashboard hunting.",
  },
];

const disclosures = [
  "Source feeds shown for every alert",
  "Route scoring formula open and inspectable",
  "Human-in-the-loop coordinator override",
  "Model version + confidence on every call",
];
