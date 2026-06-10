import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Compass,
  ShieldCheck,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Route as RouteIcon,
  Users,
  Sparkles,
} from "lucide-react";

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

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  points?: { icon: typeof Compass; label: string; detail: string }[];
};

const slides: Slide[] = [
  {
    eyebrow: "DisasterCompass",
    title: "Calm decisions in the first 60 minutes",
    body: "Ready before the warning. Clear and calm when it hits. Supported after. A community disaster action planner for floods, earthquakes, wildfires, hurricanes, and extreme heat.",
  },
  {
    eyebrow: "The problem",
    title: "When disaster strikes, families freeze",
    body: "Warnings are loud but vague. People don't know whether to go, stay, or wait — which route is safe, or who on the block can't leave alone. Minutes are lost to confusion, and the most vulnerable are left behind.",
  },
  {
    eyebrow: "Our solution",
    title: "One plan across the whole lifecycle",
    body: "DisasterCompass turns scattered signals into a single clear action, then carries each household from readiness through recovery.",
    points: [
      {
        icon: ShieldCheck,
        label: "Prepare",
        detail:
          "Readiness Radar builds the household profile and community readiness before any warning.",
      },
      {
        icon: Compass,
        label: "Respond",
        detail: "Compass Action Plan gives one action — go, stay, or wait — with the safest route.",
      },
      {
        icon: LifeBuoy,
        label: "Recover",
        detail: "Recovery Launchpad guides safe return, documentation, and access to aid.",
      },
    ],
  },
  {
    eyebrow: "How it works",
    title: "Transparent, rules-based — not a black box",
    body: "Every recommendation shows its inputs and its rejected alternatives, so families and coordinators can trust it at a glance.",
    points: [
      {
        icon: RouteIcon,
        label: "Open scoring",
        detail:
          "Routes scored from 100 on flood, bridge, blocked roads, distance, elevation, shelter fit, and accessibility.",
      },
      {
        icon: Users,
        label: "Volunteer match",
        detail:
          "Neighbors with capacity matched to those who need transport, medicine, or eyes-on.",
      },
      {
        icon: Sparkles,
        label: "Full disclosure",
        detail: "Deterministic engine, seed data, and limitations all shown inline.",
      },
    ],
  },
  {
    eyebrow: "The impact",
    title: "See it before you need it",
    body: "DisasterCompass replaces panic with one calm, explainable plan — and makes sure no household faces the first 60 minutes alone. Open the live North Creek demo to walk through a flood event.",
  },
];

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
        <div className="relative flex flex-1 flex-col justify-center px-8 py-10 sm:px-16">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#5EE6A1]">
            {index === 1 ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <Compass className="h-3.5 w-3.5" />
            )}
            {slide.eyebrow}
          </p>
          <h2 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {slide.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            {slide.body}
          </p>

          {slide.points && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {slide.points.map((p) => (
                <div
                  key={p.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#16A34A]/15 text-[#5EE6A1] ring-1 ring-[#16A34A]/30">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-base font-semibold text-white">{p.label}</p>
                  <p className="mt-1 text-sm text-white/60">{p.detail}</p>
                </div>
              ))}
            </div>
          )}
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
  );
}
