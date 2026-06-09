import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Activity, LifeBuoy, ArrowRight, PlayCircle } from "lucide-react";
import { useScenario } from "../components/ScenarioContext";
import { DemoScenarioDropdown } from "../components/DemoScenarioDropdown";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Relief Radar — Turn community signals into prioritized disaster action" },
      {
        name: "description",
        content:
          "Relief Radar helps neighborhoods prepare for, respond to, and recover from natural disasters.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { setActiveScenario } = useScenario();

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> Relief Radar
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Turn community signals into prioritized disaster action.
          </h1>
          <p className="mt-5 text-lg text-foreground/80 sm:text-xl">
            A neighborhood-scale disaster signal map and resilience dashboard for floods,
            wildfires, heatwaves, hurricanes, and earthquakes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <DemoScenarioDropdown onSelect={setActiveScenario} />
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface/70"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Prepare / Respond / Recover */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Prepare",
              body: "See risks and resource gaps before disaster strikes.",
            },
            {
              icon: Activity,
              title: "Respond",
              body: "Prioritize live community signals as events unfold.",
            },
            {
              icon: LifeBuoy,
              title: "Recover",
              body: "Track resilience and direct help where it's needed most.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-card-foreground/70">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className="text-xl font-semibold text-foreground">How it works</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { n: 1, t: "Load a scenario", icon: PlayCircle },
            { n: 2, t: "See ranked signals & gaps", icon: Activity },
            { n: 3, t: "Get an action plan", icon: LifeBuoy },
          ].map(({ n, t, icon: Icon }) => (
            <li
              key={n}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface/60 p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">
                {n}
              </span>
              <div className="flex items-center gap-2 text-foreground">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">{t}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
