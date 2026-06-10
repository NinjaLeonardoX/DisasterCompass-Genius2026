import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass,
  ShieldCheck,
  LifeBuoy,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import heroEvacuation from "@/assets/hero-evacuation.png.asset.json";

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
        <SiteHeader />

        {/* HERO */}
        <section className="mx-auto max-w-7xl px-6 pt-12 pb-4 lg:pt-20 lg:pb-6">
          <div className="grid items-start gap-14 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="road-badge relative inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/95">
                <svg className="road-border-svg" aria-hidden xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <rect className="road-asphalt" x="0" y="0" width="100%" height="100%" rx="999" ry="999" />
                  <rect className="road-edge" x="0" y="0" width="100%" height="100%" rx="999" ry="999" />
                  <rect className="road-lane" x="0" y="0" width="100%" height="100%" rx="999" ry="999" />
                </svg>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16A34A]" />
                </span>
                <span className="relative">Prepare.</span>
                <span className="relative inline-block hurricane-text">
                  Respond.
                  <span aria-hidden className="hurricane-spark hurricane-spark-1" />
                  <span aria-hidden className="hurricane-spark hurricane-spark-2" />
                  <span aria-hidden className="hurricane-spark hurricane-spark-3" />
                </span>
                <span className="relative">Recover.</span>
              </div>



              <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Ready before the warning.{" "}
                <span className="bg-gradient-to-r from-[#16A34A] to-[#5EE6A1] bg-clip-text text-transparent">
                  Clear and calm
                </span>{" "}
                when it hits. Supported after.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                When disaster strikes, families freeze. Disaster Compass gives every household one
                clear action — go, stay, or wait — with the safest route and a neighbor to help
                those who can't leave alone, then guides them through recovery. Built for floods,
                earthquakes, wildfires, hurricanes, and extreme heat.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/compass"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(22,163,74,0.7)] transition hover:brightness-110"
                >
                  Generate My Action Plan
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#features"
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

            {/* Hero image */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[16/11]">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#16A34A]/25 to-transparent blur-2xl" />
                <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5">
                  <img
                    src={heroEvacuation.url}
                    alt="A family follows a glowing green evacuation route to safety as floodwaters rise at dusk"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1a2e]/70 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEMS */}
        <section id="features" className="mx-auto max-w-7xl px-6 pt-4 pb-12 lg:pt-6 lg:pb-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-[#16A34A]">The system</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              One plan. Three systems. Zero guesswork.
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Prepare before. Respond during. Recover after — one continuous flow that carries every
              household from readiness to recovery.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {systems.map((s) => (
              <div
                key={s.name}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-8 transition duration-300 hover:-translate-y-1.5 hover:border-[#16A34A]/40 hover:shadow-[0_30px_60px_-25px_rgba(22,163,74,0.55)]"
              >
                {/* Corner glow on hover */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#16A34A]/25 opacity-0 blur-3xl transition duration-500 group-hover:opacity-100" />
                {/* Top sheen line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#16A34A]/70 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

                <div className="relative flex items-start justify-between">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16A34A]/15 ring-1 ring-[#16A34A]/30 transition duration-300 group-hover:scale-105 group-hover:bg-[#16A34A]/25">
                    <s.icon className="h-7 w-7 text-[#5EE6A1]" />
                  </span>
                  <span className="text-6xl font-black leading-none text-white/[0.06] transition duration-300 group-hover:text-white/10">
                    {s.step}
                  </span>
                </div>

                <div className="relative mt-6">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    {s.when}
                  </span>
                  <h3 className="mt-3 text-2xl font-bold text-white">{s.name}</h3>
                  <p className="text-sm font-medium text-[#5EE6A1]">{s.sub}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{s.desc}</p>
                </div>

                <div className="relative mt-5 flex flex-wrap gap-2">
                  {s.points.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/75 ring-1 ring-white/10"
                    >
                      <CheckCircle2 className="h-3 w-3 text-[#16A34A]" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
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
                Open the live North Creek demo and walk through the first 60 minutes of a flood
                event.
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
              <span>DisasterCompass · 2026</span>
            </div>
            <span>For demonstration only. Not an official emergency service.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

const systems = [
  {
    step: "01",
    when: "Before",
    icon: ShieldCheck,
    name: "Prepare",
    sub: "Readiness Radar",
    desc: "Pre-solve risk, destination, route, and gaps so the plan is ready before the warning ever arrives.",
    points: ["Household risk profile", "Community readiness", "Hazard awareness"],
  },
  {
    step: "02",
    when: "During",
    icon: Compass,
    name: "Respond",
    sub: "Compass Action Plan",
    desc: "One clear action — GO, STAY, or WAIT — with the safest route and a neighbor for those who can't leave alone.",
    points: ["GO / STAY / WAIT", "Safe route map", "Volunteer match"],
  },
  {
    step: "03",
    when: "After",
    icon: LifeBuoy,
    name: "Recover",
    sub: "Recovery Launchpad",
    desc: "Guided steps for damage, assistance, cleanup, and wellbeing — clear and calm, never overwhelming.",
    points: ["Recovery checklist", "Assistance steps", "Wellbeing"],
  },
];
