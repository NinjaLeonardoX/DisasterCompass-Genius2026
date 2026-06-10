import { Radio, Database } from "lucide-react";
import type { DataSource } from "@/lib/fallback";

// Small pill that makes the live-vs-demo provenance of a panel explicit.
// "Live" when the data came from a public API this session; "Demo data" when
// it's the offline seed (flag off, key missing, or the source was unreachable).

export function LiveDataBadge({
  source,
  className = "",
}: {
  source: DataSource;
  className?: string;
}) {
  const live = source === "live";
  return (
    <span
      title={
        live
          ? "Live data from a public API"
          : "Demo data — offline seed (rules and shelters/routes remain seeded)"
      }
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        live
          ? "bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]"
          : "bg-card-foreground/10 text-card-foreground/60",
        className,
      ].join(" ")}
    >
      {live ? (
        <Radio className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Database className="h-3 w-3" aria-hidden="true" />
      )}
      {live ? "Live" : "Demo data"}
    </span>
  );
}
