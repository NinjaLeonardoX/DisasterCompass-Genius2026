import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — DisasterCompass" },
      { name: "description", content: "How DisasterCompass scores signals and resilience." },
    ],
  }),
  component: MethodologyPage,
});

const sections = [
  "How we score signals",
  "How we score community resilience",
  "Data sources",
  "Demo & fallback data",
  "Limitations",
  "Privacy approach",
];

function MethodologyPage() {
  return (
    <PageShell title="Methodology" showStepIndicator={false}>
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
