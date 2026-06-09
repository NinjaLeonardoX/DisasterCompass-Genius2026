import { Radio, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Small indicator showing whether a panel is backed by a live API or the
// offline seed. Driven by the `source` field returned from useLiveOrSeed.
// Reuses the existing shadcn Badge so it matches the app's styling.

export function LiveDataBadge({ source }: { source: "live" | "seed" }) {
  if (source === "live") {
    return (
      <Badge className="gap-1 bg-severity-low text-white hover:bg-severity-low/90">
        <Radio className="h-3 w-3" aria-hidden="true" />
        Live
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Database className="h-3 w-3" aria-hidden="true" />
      Demo data
    </Badge>
  );
}
