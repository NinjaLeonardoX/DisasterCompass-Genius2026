import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";

export const Route = createFileRoute("/ai-disclosure")({
  head: () => ({
    meta: [
      { title: "AI Disclosure — DisasterCompass" },
      { name: "description", content: "How AI was used to build DisasterCompass." },
    ],
  }),
  component: AIDisclosurePage,
});

const sections = [
  "AI tools used",
  "What we built ourselves",
  "How we verified correctness",
  "Libraries & data sources",
  "Completion statement",
];

function AIDisclosurePage() {
  return (
    <PageShell title="AI Disclosure" showStepIndicator={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <section
            key={s}
            className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10"
          >
            <h2 className="text-lg font-semibold">{s}</h2>
            <p className="mt-2 text-sm text-card-foreground/70">
              Placeholder — details will be documented here.
            </p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
