import { Link } from "@tanstack/react-router";
import { FLOW_STEPS } from "./FlowNav";

interface Props {
  currentPath: string;
}

export function StepIndicator({ currentPath }: Props) {
  const idx = FLOW_STEPS.findIndex((s) => s.to === currentPath);
  if (idx === -1) return null;
  const total = FLOW_STEPS.length;
  const step = FLOW_STEPS[idx];

  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-2 text-xs text-foreground/70"
      aria-label="Flow progress"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {idx + 1}
        </span>
        Step {idx + 1} of {total} — {step.label}
      </span>
      <div className="flex items-center gap-1" aria-hidden="true">
        {FLOW_STEPS.map((s, i) => (
          <Link
            key={s.to}
            to={s.to}
            className={[
              "h-1.5 w-6 rounded-full transition-colors",
              i <= idx ? "bg-primary" : "bg-surface",
            ].join(" ")}
            aria-label={`Go to step ${i + 1}: ${s.label}`}
          />
        ))}
      </div>
    </div>
  );
}
