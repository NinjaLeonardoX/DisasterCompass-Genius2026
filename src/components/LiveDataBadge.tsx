import { Radio, Database, Ruler } from "lucide-react";

// Small pill that makes the provenance of a panel explicit:
//  - "Live"      → data came from a public API this session
//  - "Estimated" → real inputs, but a straight-line/heuristic estimate (e.g.
//                   routing without an ORS key — distances are real, roads aren't)
//  - "Demo data" → offline seed (flag off, key missing, or source unreachable)
// Accepts the app's DataSource ("live" | "demo") plus the wider "estimated".

export type BadgeSource = "live" | "demo" | "estimated";

export function LiveDataBadge({
  source,
  className = "",
}: {
  source: BadgeSource;
  className?: string;
}) {
  const config = {
    live: {
      Icon: Radio,
      label: "Live",
      title: "Live data from a public API",
      cls: "bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]",
    },
    estimated: {
      Icon: Ruler,
      label: "Estimated",
      title:
        "Real location & distances, but straight-line estimate (add the routing key for real roads)",
      cls: "bg-[color:var(--severity-moderate)]/15 text-[color:var(--severity-moderate)]",
    },
    demo: {
      Icon: Database,
      label: "Demo data",
      title: "Demo data — offline seed (rules and shelters/routes remain seeded)",
      cls: "bg-card-foreground/10 text-card-foreground/60",
    },
  }[source];

  return (
    <span
      title={config.title}
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        config.cls,
        className,
      ].join(" ")}
    >
      <config.Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
