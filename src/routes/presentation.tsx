import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Compass,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Maximize2,
  Minimize2,
  Download,
  Sparkles,
  LogOut,
} from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import dcLogo from "@/assets/disaster-compass-logo.png.asset.json";

export const Route = createFileRoute("/presentation")({
  head: () => ({
    meta: [
      { title: "Presentation — Disaster Compass" },
      {
        name: "description",
        content: "A short slide deck introducing Disaster Compass.",
      },
    ],
  }),
  component: PresentationPage,
});

type PipeCol = { heading: string; sub: string; items: string[] };

type Slide = {
  eyebrow: string;
  title: string;
  cover?: boolean;
  kicker?: string;
  tagline?: string;
  presenters?: string[];
  team?: string;
  lead?: string;
  stats?: { value: string; label: string }[];
  note?: string;
  decision?: string[];
  positioning?: string[];
  pipeline?: { data: PipeCol; rules: PipeCol; action: PipeCol };
  tech?: { layers: { label: string; items: string[] }[]; tooling?: string[] };
  aiTools?: { name: string; use: string }[];
  footer?: string;
  source?: string;
};

const slides: Slide[] = [
  // 1 — Cover
  {
    cover: true,
    eyebrow: "",
    kicker: "Prepare · Respond · Recover",
    title: "Right Direction. Right Location. Right Help.",
    tagline: "Ready before the warning. Clear and calm when it hits. Supported after.",
    presenters: ["William Riano", "Miguel Riano Jr"],
    team: "Team 8934",
  },
  // 2 — Context
  {
    eyebrow: "Context — Why action planning matters",
    title: "Alerts create awareness. Communities need action paths.",
    stats: [
      {
        value: "27",
        label: "billion-dollar weather & climate disasters struck the U.S. in 2024.",
      },
      {
        value: "69%",
        label: "of U.S. households haven't learned their evacuation routes.",
      },
    ],
    note: "FEMA preparedness data also shows most households haven't practiced their plan or planned with their neighbors.",
    footer: "A warning tells you something is coming — not what to do next.",
    source: "Sources: NOAA Billion-Dollar Disasters · FEMA 2023 National Household Survey",
  },
  // 3 — Strategy + how it works
  {
    eyebrow: "Strategy — from alert to action",
    title: "From alert to the safest next action.",
    lead: "Disaster Compass turns an official alert into one clear decision:",
    decision: ["GO", "STAY", "WAIT"],
    pipeline: {
      data: {
        heading: "Data",
        sub: "Live APIs · seeded demo fallback",
        items: [
          "Maps — MapTiler · Weather & elevation — Open-Meteo",
          "Alerts — NOAA/NWS & OpenWeatherMap · Routing — OpenRouteService",
          "Flood zone, hazard risk, shelters & volunteers — seeded demo",
        ],
      },
      rules: {
        heading: "Rules",
        sub: "Deterministic — no ML",
        items: [
          "GO / STAY / WAIT, chosen per hazard + Residence/Commercial",
          "Open 100-point route-safety score",
          "Weights tuned & saved in the IQ Engine",
        ],
      },
      action: {
        heading: "Action",
        sub: "One clear plan",
        items: [
          "One decision + plain-language instruction",
          "Safest scored route & a matched volunteer",
          "Recovery checklist for after impact",
        ],
      },
    },
    footer: "AI explains. Rules decide. Humans approve.",
    source:
      "AI assist: Google Gemini 3 Flash (Lovable AI Gateway) generates location plans — never the GO/STAY/WAIT decision.",
  },
  // 4 — Tech stack
  {
    eyebrow: "System architecture — tech stack",
    title: "How it's built.",
    tech: {
      layers: [
        {
          label: "Client",
          items: ["React", "TypeScript", "Tailwind CSS", "shadcn/ui (Radix)", "Leaflet maps"],
        },
        {
          label: "App framework",
          items: ["TanStack Start (SSR)", "TanStack Router", "TanStack Query"],
        },
        {
          label: "Rules core",
          items: ["Action engine", "Route scoring", "Volunteer matching", "Recovery steps"],
        },
        {
          label: "Real-time data",
          items: [
            "MapTiler tiles",
            "Open-Meteo (weather · elevation)",
            "NWS · OpenWeatherMap (alerts)",
            "OpenRouteService (routing)",
            "OSM Nominatim (geocoding)",
          ],
        },
      ],
      tooling: ["Vite", "Bun", "ESLint", "Prettier"],
    },
    footer: "Live APIs: MapTiler, Open-Meteo, NWS, OpenWeatherMap, OpenRouteService, and OSM Nominatim.",
  },
  // 5 — AI disclosure
  {
    eyebrow: "Transparency — AI disclosure",
    title: "AI tools we used.",
    aiTools: [
      { name: "ChatGPT", use: "Ideation, copywriting, and research" },
      { name: "Claude (Claude Code)", use: "Code generation and implementation" },
      {
        name: "Lovable",
        use: "Full-stack scaffolding, hosting & in-app AI gateway — Google Gemini 3 Flash",
      },
      { name: "Flow Scholar", use: "Task management and strategy" },
    ],
    note: "AI accelerated the build, but the rules engine stays deterministic and human-reviewed — AI explains, rules decide, humans approve.",
  },
  // 6 — Demo
  {
    cover: true,
    eyebrow: "",
    kicker: "Disaster Compass",
    title: "DEMO",
    tagline: "Let's see it live.",
    presenters: ["William Riano", "Miguel Riano Jr"],
    team: "Team 8934",
  },
];

const decisionStyles: Record<string, string> = {
  GO: "bg-[#16A34A] text-white ring-[#16A34A]/40",
  STAY: "bg-amber-400 text-slate-900 ring-amber-300/50",
  WAIT: "bg-sky-500 text-white ring-sky-400/40",
};

/** A single templated slide — branded header, content, and footer. */
function SlideView({
  slide,
  index,
  total,
  onExit,
}: {
  slide: Slide;
  index: number;
  total: number;
  onExit?: () => void;
}) {
  if (slide.cover) {
    return (
      <div className="slide relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#0f1a2e] px-8 pb-24 pt-12 text-center text-white">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-[#16A34A] opacity-15 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-[380px] w-[380px] rounded-full bg-[#2a3b55] opacity-50 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center">
          {slide.kicker && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#5EE6A1] backdrop-blur">
              {slide.kicker}
            </span>
          )}

          <div className="mt-7 rounded-2xl bg-white px-6 py-4 shadow-2xl shadow-black/40">
            <img src={dcLogo.url} alt="Disaster Compass" className="h-14 w-auto" />
          </div>

          <h2 className="mt-7 max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {slide.title}
          </h2>
          {slide.tagline && (
            <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">{slide.tagline}</p>
          )}

          {slide.presenters && (
            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="text-base font-semibold text-white sm:text-lg">
                {slide.presenters.join("  ·  ")}
              </p>
              {slide.team && (
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.22em] text-[#5EE6A1]">
                  {slide.team}
                </p>
              )}
            </div>
          )}

          {onExit && index === total - 1 && (
            <button
              type="button"
              onClick={onExit}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0f1a2e] shadow-lg shadow-black/30 transition hover:bg-white/90"
            >
              <LogOut className="h-4 w-4" />
              Exit presentation
            </button>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-6 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
          Disaster Compass · 2026
        </div>
      </div>
    );
  }

  return (
    <div className="slide relative flex h-full w-full flex-col overflow-hidden bg-[#0f1a2e] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#2a3b55] opacity-40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-[#16A34A] opacity-10 blur-3xl" />
      </div>

      {/* Template header */}
      <div className="relative flex items-center justify-between border-b border-white/10 px-8 pb-4 pt-6 sm:px-12">
        <div className="rounded-md bg-white px-2.5 py-1.5 shadow-sm">
          <img src={dcLogo.url} alt="Disaster Compass" className="h-7 w-auto" />
        </div>
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5EE6A1] sm:text-xs">
          <Compass className="h-3.5 w-3.5" />
          {slide.eyebrow}
        </p>
      </div>

      {/* Slide content */}
      <div className="relative flex flex-1 flex-col justify-center overflow-y-auto px-8 py-6 sm:px-12">
        <h2 className="max-w-4xl text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
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
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
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

        {/* Data → Rules → Action pipeline */}
        {slide.pipeline && (
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {[slide.pipeline.data, slide.pipeline.rules, slide.pipeline.action].map((col, i) => (
              <Fragment key={col.heading}>
                <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-lg font-bold text-white">{col.heading}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#5EE6A1]">
                    {col.sub}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-snug text-white/75">
                    {col.items.map((it) => (
                      <li key={it} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5EE6A1]" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {i < 2 && (
                  <ArrowRight className="mx-auto hidden h-6 w-6 shrink-0 self-center text-[#5EE6A1] lg:block" />
                )}
              </Fragment>
            ))}
          </div>
        )}

        {/* Tech-stack systems diagram */}
        {slide.tech && (
          <div className="mt-6 space-y-1.5">
            {slide.tech.layers.map((layer, i) => (
              <div key={layer.label}>
                <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center">
                  <span className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wider text-[#5EE6A1]">
                    {layer.label}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {layer.items.map((it) => (
                      <span
                        key={it}
                        className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-sm text-white/85 ring-1 ring-white/10"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
                {i < slide.tech!.layers.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ChevronDown className="h-4 w-4 text-white/30" />
                  </div>
                )}
              </div>
            ))}
            {slide.tech.tooling && (
              <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-white/50">
                <span className="font-semibold uppercase tracking-wider">Tooling</span>
                {slide.tech.tooling.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white/[0.05] px-2.5 py-1 ring-1 ring-white/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI disclosure */}
        {slide.aiTools && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slide.aiTools.map((t) => (
              <div key={t.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#5EE6A1]" />
                  <p className="text-base font-semibold text-white">{t.name}</p>
                </div>
                <p className="mt-1.5 text-sm text-white/60">{t.use}</p>
              </div>
            ))}
          </div>
        )}

        {slide.note && (
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-white/60">{slide.note}</p>
        )}

        {slide.footer && (
          <p className="mt-6 max-w-3xl border-l-2 border-[#16A34A] pl-4 text-base font-semibold text-white sm:text-lg">
            {slide.footer}
          </p>
        )}

        {slide.source && <p className="mt-4 max-w-3xl text-[11px] text-white/40">{slide.source}</p>}
      </div>

      {/* Template footer */}
      <div className="relative flex items-center justify-between border-t border-white/10 px-8 py-3.5 text-[11px] font-medium text-white/40 sm:px-12">
        <span>Disaster Compass · Community Disaster Action Planner</span>
        <span>
          {index + 1} / {total}
        </span>
      </div>
    </div>
  );
}

function PresentationPage() {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, slides.length - 1)), []);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const exitPresentation = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    navigate({ to: "/" });
  }, [navigate]);

  const toggleFullscreen = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const downloadPdf = useCallback(() => window.print(), []);

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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Presentation
            </h1>
            <p className="mt-1 text-sm text-foreground/70">
              Use the arrows (or ← →) to move. Maximize to present, or download a PDF.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadPdf}
              className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
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
        </div>

        {/* Interactive stage */}
        <div
          ref={stageRef}
          className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0f1a2e] shadow-2xl shadow-black/30 ring-1 ring-white/10"
        >
          <SlideView slide={slide} index={index} total={slides.length} onExit={exitPresentation} />

          {/* Prev / Next arrows */}
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur transition hover:bg-black/50 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={index === slides.length - 1}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur transition hover:bg-black/50 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute inset-x-0 bottom-14 z-10 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-[#16A34A]" : "w-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Print-only deck: one landscape slide per page for PDF export */}
      <div id="print-deck" aria-hidden="true">
        {slides.map((s, i) => (
          <div key={i} className="print-page">
            <SlideView slide={s} index={i} total={slides.length} />
          </div>
        ))}
      </div>
    </div>
  );
}
