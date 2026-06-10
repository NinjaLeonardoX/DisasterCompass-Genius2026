import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Compass,
  ShieldCheck,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";

export const Route = createFileRoute("/presentation")({
  head: () => ({
    meta: [
      { title: "Presentation — DisasterCompass" },
      {
        name: "description",
        content: "A short slide deck introducing DisasterCompass.",
      },
    ],
  }),
  component: PresentationPage,
});

type Column = { icon: typeof Compass; label: string; detail: string };

type Slide = {
  eyebrow: string;
  title: string;
  lead?: string;
  stats?: { value: string; label: string }[];
  note?: string;
  decision?: string[];
  positioning?: string[];
  flow?: { inputs: string[]; core: string[]; output: string };
  columns?: Column[];
  bullets?: string[];
  footer?: string;
  close?: string;
  source?: string;
};

const slides: Slide[] = [
  // 1 — Context
  {
    eyebrow: "Context — Why action planning matters",
    title: "Alerts create awareness. Communities need action paths.",
    stats: [
      {
        value: "27",
        label: "billion-dollar weather & climate disasters struck the U.S. in 2024.",
      },
    ],
    note: "FEMA preparedness data shows many households still don't know their evacuation routes, haven't practiced their plan, or haven't planned with their neighbors.",
    footer: "A warning tells you something is coming — not what to do next.",
    source: "Sources: NOAA Billion-Dollar Disasters · FEMA National Household Survey",
  },
  // 2 — Strategy
  {
    eyebrow: "Strategy — What we built",
    title: "From alert to safest next action.",
    lead: "DisasterCompass is a Community Disaster Action Planner. Its core output is a single decision:",
    decision: ["GO", "STAY", "WAIT"],
    positioning: ["Not another alert app", "Not a checklist", "Not just a map"],
    footer:
      "North Star: help every household take the safest next action during a natural disaster.",
  },
  // 3 — Architecture
  {
    eyebrow: "Implementation architecture",
    title: "Data → Rules → Action.",
    flow: {
      inputs: ["Household profile", "Hazard risk", "Shelters · routes · volunteers"],
      core: ["Action engine", "Route scoring", "Volunteer matching", "Recovery steps"],
      output: "Compass Plan",
    },
    footer: "AI explains. Rules decide. Humans approve.",
  },
  // 4 — Product process
  {
    eyebrow: "Product process",
    title: "One system across Prepare, Respond, Recover.",
    columns: [
      {
        icon: ShieldCheck,
        label: "Prepare",
        detail: "Readiness Radar pre-solves risk, destination, route, and gaps.",
      },
      {
        icon: Compass,
        label: "Respond",
        detail: "Compass Plan activates GO / STAY / WAIT and the safe route.",
      },
      {
        icon: LifeBuoy,
        label: "Recover",
        detail: "Recovery Steps guide damage, assistance, cleanup, and wellbeing.",
      },
    ],
  },
  // 5 — Functionality + impact
  {
    eyebrow: "App functionality & impact",
    title: "Clear action, not confusion.",
    bullets: [
      "Risk radar",
      "Safe route map",
      "Rejected-route explanation",
      "Volunteer approval",
      "Coordinator status",
      "Recovery checklist",
    ],
    footer:
      "DisasterCompass helps communities prepare earlier, respond faster, and recover clearer.",
    close: "We turn official information into local action.",
  },
];

const decisionStyles: Record<string, string> = {
  GO: "bg-[#16A34A] text-white ring-[#16A34A]/40",
  STAY: "bg-amber-400 text-slate-900 ring-amber-300/50",
  WAIT: "bg-sky-500 text-white ring-sky-400/40",
};

function PresentationPage() {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, slides.length - 1)), []);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = slides[index];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Presentation
            </h1>
            <p className="mt-1 text-sm text-foreground/70">
              Use the arrows (or ← →) to move. Maximize for full-screen.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:brightness-105"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" /> Exit
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" /> Maximize
              </>
            )}
          </button>
        </div>

        {/* Slide stage */}
        <div
          ref={containerRef}
          className="relative flex aspect-video w-full flex-col overflow-hidden rounded-2xl bg-[#0f1a2e] text-white shadow-2xl shadow-black/30 ring-1 ring-white/10"
        >
          {/* Ambient background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#2a3b55] opacity-40 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-[#16A34A] opacity-10 blur-3xl" />
          </div>

          {/* Slide content */}
          <div className="relative flex flex-1 flex-col justify-center overflow-y-auto px-8 py-8 sm:px-14 lg:px-16">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5EE6A1] sm:text-xs">
              <Compass className="h-3.5 w-3.5" />
              {slide.eyebrow}
            </p>
            <h2 className="mt-3 max-w-4xl text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {slide.title}
            </h2>

            {slide.lead && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                {slide.lead}
              </p>
            )}

            {/* Stats */}
            {slide.stats && (
              <div className="mt-6 flex flex-wrap gap-5">
                {slide.stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                  >
                    <p className="text-5xl font-bold text-[#5EE6A1] sm:text-6xl">{s.value}</p>
                    <p className="mt-2 max-w-xs text-sm text-white/70">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* GO / STAY / WAIT */}
            {slide.decision && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {slide.decision.map((d) => (
                  <span
                    key={d}
                    className={`inline-flex items-center rounded-xl px-6 py-3 text-xl font-extrabold tracking-wide ring-1 sm:text-2xl ${
                      decisionStyles[d] ?? "bg-white/10 text-white ring-white/20"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}

            {/* Positioning ("not …") */}
            {slide.positioning && (
              <div className="mt-6 flex flex-wrap gap-2">
                {slide.positioning.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            {/* Architecture flow */}
            {slide.flow && (
              <div className="mt-7 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
                <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Inputs
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-white/80">
                    {slide.flow.inputs.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>

                <ArrowRight className="mx-auto hidden h-6 w-6 shrink-0 text-[#5EE6A1] lg:block" />

                <div className="flex-1 rounded-2xl border border-[#16A34A]/40 bg-[#16A34A]/10 p-5 ring-1 ring-[#16A34A]/30">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5EE6A1]">
                    Rules Core
                  </p>
                  <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-white">
                    {slide.flow.core.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>

                <ArrowRight className="mx-auto hidden h-6 w-6 shrink-0 text-[#5EE6A1] lg:block" />

                <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Output
                  </p>
                  <p className="mt-2 text-xl font-bold text-white">{slide.flow.output}</p>
                </div>
              </div>
            )}

            {/* Three-phase columns */}
            {slide.columns && (
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {slide.columns.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#16A34A]/15 text-[#5EE6A1] ring-1 ring-[#16A34A]/30">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-lg font-semibold text-white">{c.label}</p>
                    <p className="mt-1 text-sm text-white/60">{c.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Functionality grid */}
            {slide.bullets && (
              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {slide.bullets.map((b) => (
                  <div
                    key={b}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/90"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5EE6A1]" />
                    {b}
                  </div>
                ))}
              </div>
            )}

            {slide.note && (
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/60">{slide.note}</p>
            )}

            {slide.footer && (
              <p className="mt-7 max-w-3xl border-l-2 border-[#16A34A] pl-4 text-base font-semibold text-white sm:text-lg">
                {slide.footer}
              </p>
            )}

            {slide.close && (
              <p className="mt-4 bg-gradient-to-r from-[#16A34A] to-[#5EE6A1] bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
                {slide.close}
              </p>
            )}

            {slide.source && <p className="mt-5 text-[11px] text-white/40">{slide.source}</p>}
          </div>

          {/* Controls */}
          <div className="relative flex items-center justify-between px-8 pb-6 sm:px-16">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              aria-label="Previous slide"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-6 bg-[#16A34A]" : "w-2 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              disabled={index === slides.length - 1}
              aria-label="Next slide"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Slide counter */}
          <div className="pointer-events-none absolute right-6 top-5 text-xs font-medium text-white/40">
            {index + 1} / {slides.length}
          </div>
        </div>
      </main>
    </div>
  );
}
