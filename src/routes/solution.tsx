import { createFileRoute } from "@tanstack/react-router";
import { Layers, Cpu, Database, GitBranch, Workflow, ShieldCheck } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { SiteHeader } from "../components/SiteHeader";

export const Route = createFileRoute("/solution")({
  head: () => ({
    meta: [
      { title: "Solution — Disaster Compass" },
      {
        name: "description",
        content:
          "The architecture and implementation of Disaster Compass: a rules-based, transparent disaster action planner.",
      },
    ],
  }),
  component: SolutionPage,
});

type Layer = {
  id: string;
  label: string;
  icon: typeof Layers;
  summary: string;
  items: { name: string; detail: string }[];
};

const layers: Layer[] = [
  {
    id: "presentation",
    label: "Presentation layer",
    icon: Layers,
    summary:
      "A React single-page app rendered with TanStack Start (SSR) and routed by file-based TanStack Router. Styling is Tailwind CSS with shadcn/ui (Radix) primitives.",
    items: [
      { name: "React + TypeScript", detail: "Typed, component-driven UI." },
      {
        name: "TanStack Start + Router",
        detail: "File-based routes under src/routes with SSR and scroll restoration.",
      },
      {
        name: "Tailwind + shadcn/ui",
        detail: "Utility styling over accessible Radix primitives.",
      },
      {
        name: "Leaflet map",
        detail: "Renders routes, shelters, and hazard layers over North Creek.",
      },
    ],
  },
  {
    id: "engine",
    label: "Decision engine",
    icon: Cpu,
    summary:
      "Pure, deterministic functions turn signals into action. No black box: the same inputs always produce the same output, and every score is explained inline.",
    items: [
      {
        name: "decideAction (lib/actions.ts)",
        detail:
          "Maps disaster + household profile to a single go / stay / wait action with a reason.",
      },
      {
        name: "scoreRoute (lib/scoring.ts)",
        detail:
          "Scores routes from 100 using named terms — flood, bridge, blocked-road, distance/time penalties and elevation, shelter-fit, accessibility bonuses.",
      },
      {
        name: "getBestRoute",
        detail: "Selects the highest-scoring non-rejected route, with a safe fallback.",
      },
      {
        name: "Recovery checklist (lib/recovery.ts)",
        detail: "Builds the phase-aware post-event checklist.",
      },
    ],
  },
  {
    id: "state",
    label: "State & data",
    icon: Database,
    summary:
      "Root-level React context holds the golden-path flow so decisions survive navigation. The demo runs on in-memory seed data — no live APIs, no database.",
    items: [
      {
        name: "ScenarioContext",
        detail:
          "Disaster selection, route choice, volunteer approval, recovery progress — provided above all routes.",
      },
      {
        name: "PhaseContext",
        detail:
          "Tracks the active lifecycle phase (Prepare / Respond / Recover) and resident vs community mode.",
      },
      {
        name: "Seed data (data/seed.ts)",
        detail:
          "Households, shelters, routes, and blocked roads for the fictional town of North Creek.",
      },
      {
        name: "TanStack Query",
        detail: "Caching layer ready for any async data fetching.",
      },
    ],
  },
];

const principles = [
  {
    icon: ShieldCheck,
    title: "Transparent by construction",
    body: "Every recommendation shows its inputs, weights, and rejected alternatives. Trust is earned in the UI, not asserted.",
  },
  {
    icon: Workflow,
    title: "Deterministic & testable",
    body: "The engine is pure functions with unit tests (e.g. recovery.test.ts) — reproducible and easy to verify.",
  },
  {
    icon: GitBranch,
    title: "Lifecycle-shaped",
    body: "Code is organized around Prepare, Respond, and Recover so the product mirrors how emergencies actually unfold.",
  },
];

function SolutionPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageShell
        title="Solution"
        description="How Disaster Compass is architected and implemented — a rules-based, transparent action planner."
        showStepIndicator={false}
      >
        <div className="space-y-12">
          {/* Architecture layers */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              System architecture
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-foreground/70">
              Three layers, cleanly separated: a React presentation layer, a pure decision engine,
              and an in-memory state and data layer.
            </p>

            <div className="mt-6 space-y-6">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <layer.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold">{layer.label}</h3>
                  </div>
                  <p className="mt-3 text-sm text-card-foreground/70">{layer.summary}</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {layer.items.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-xl border border-border/60 bg-background/40 p-4"
                      >
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="mt-1 text-xs text-foreground/65">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Design principles */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Implementation principles
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {principles.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-card-foreground/70">{p.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageShell>
    </div>
  );
}
