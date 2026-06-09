import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FLOW_STEPS } from "./FlowNav";

interface Props {
  currentPath: string;
}

export function NextBackNav({ currentPath }: Props) {
  const idx = FLOW_STEPS.findIndex((s) => s.to === currentPath);
  if (idx === -1) return null;

  const prev = idx > 0 ? FLOW_STEPS[idx - 1] : null;
  const next = idx < FLOW_STEPS.length - 1 ? FLOW_STEPS[idx + 1] : null;

  return (
    <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
      {prev ? (
        <Link
          to={prev.to}
          className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          to={next.to}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          Next: {next.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
