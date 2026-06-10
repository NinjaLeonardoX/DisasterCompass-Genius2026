import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Cpu, Database, ShieldAlert } from "lucide-react";
import { PageShell } from "../components/PageShell";

export const Route = createFileRoute("/ai-disclosure")({
  head: () => ({
    meta: [
      { title: "AI Use Disclosure — Disaster Compass" },
      { name: "description", content: "How AI was used to build Disaster Compass." },
    ],
  }),
  component: AIDisclosurePage,
});

const tools: { name: string; did: string }[] = [
  {
    name: "Lovable",
    did: "UI and project scaffolding, edge functions, data to Supabase operations and various functionalities.",
  },
  {
    name: "Claude Code",
    did: "Complex TypeScript implementation, shared types, rules engines (action / scoring / matching / recovery), react-leaflet map integration, and live-API data layer.",
  },
  {
    name: "ChatGPT",
    did: "Advised on architecture, provided focused code snippets, and assisted with prose.",
  },
  {
    name: "Claude",
    did: "Advised on architecture, provided focused code snippets, and assisted with prose.",
  },
  {
    name: "FlowScholar",
    did: "Task management, task assignment, and understanding workflows with minimal AI assistance.",
  },
];

function AIDisclosurePage() {
  return (
    <PageShell
      title="AI Use Disclosure"
      description="What we built, and how AI assisted."
      showStepIndicator={false}
    >
      <div className="space-y-8">
        <p className="max-w-3xl text-base text-foreground/75">
          Disaster Compass was built by a two-student team during the official competition window. We
          used AI tools to assist development; all architecture, data design, and final decisions
          were made by us, and no code or designs were copied.
        </p>

        <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Tools and what each did
            </h2>
          </div>
          <dl className="mt-4 space-y-3">
            {tools.map((t) => (
              <div
                key={t.name}
                className="flex flex-col gap-1 rounded-xl bg-foreground/5 p-4 sm:flex-row sm:gap-3"
              >
                <dt className="shrink-0 font-semibold text-foreground sm:w-32">{t.name}</dt>
                <dd className="text-sm text-card-foreground/75">{t.did}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Cpu className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              How AI is used in the product
            </h2>
          </div>
          <p className="mt-3 text-sm text-card-foreground/75">
            Rules decide every recommendation — AI does not make safety decisions. AI-style text
            only phrases the rule output in plain, calm language. Volunteer help always requires
            human coordinator approval.
          </p>
        </section>

        <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Database className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Data honesty</h2>
          </div>
          <p className="mt-3 text-sm text-card-foreground/75">
            Disaster Compass uses real-time map APIs and live data feeds for routing, weather,
            alerts, and elevation. The app is built on a modern tech stack and pulls from public
            data sources where available, with sensible fallbacks when connectivity is limited.
          </p>
        </section>

        <section className="rounded-2xl border border-severity-critical/30 bg-severity-critical/5 p-6 text-card-foreground shadow-md shadow-black/10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-severity-critical/15 text-severity-critical">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Emergency services
            </h2>
          </div>
          <p className="mt-3 text-sm text-card-foreground/80">
            Disaster Compass complements — it does not replace — emergency services.{" "}
            <strong className="font-semibold text-foreground">Call 911 in an emergency.</strong>
          </p>
        </section>
      </div>
    </PageShell>
  );
}
