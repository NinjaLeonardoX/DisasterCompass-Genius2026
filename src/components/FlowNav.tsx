import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

interface FlowStep {
  to: "/" | "/map" | "/report" | "/action-plan";
  label: string;
  short: string;
  hub?: boolean;
}

export const FLOW_STEPS: readonly FlowStep[] = [
  { to: "/", label: "Dashboard", short: "Dashboard", hub: true },
  { to: "/map", label: "Map", short: "Map" },
  { to: "/report", label: "Report", short: "Report" },
  { to: "/action-plan", label: "Action Plan", short: "Action" },
] as const;

export type FlowPath = FlowStep["to"];

interface FlowNavProps {
  currentPath: string;
  variant?: "horizontal" | "vertical";
  onNavigate?: () => void;
}

export function FlowNav({ currentPath, variant = "horizontal", onNavigate }: FlowNavProps) {
  if (variant === "vertical") {
    return (
      <ol className="flex flex-col gap-1" aria-label="Primary flow">
        {FLOW_STEPS.map((step, i) => {
          const active = currentPath === step.to;
          return (
            <li key={step.to}>
              <Link
                to={step.to}
                onClick={onNavigate}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-base",
                  active
                    ? "bg-primary/15 text-foreground font-medium"
                    : "text-foreground/85 hover:bg-surface",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <StepBadge n={i + 1} active={active} hub={step.hub} />
                <span>{step.label}</span>
                {step.hub && <HubTag />}
              </Link>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="flex items-center gap-1" aria-label="Primary flow">
      {FLOW_STEPS.map((step, i) => {
        const active = currentPath === step.to;
        return (
          <li key={step.to} className="flex items-center">
            <Link
              to={step.to}
              className={[
                "group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-foreground"
                  : "text-foreground/75 hover:bg-surface hover:text-foreground",
                step.hub && !active ? "ring-1 ring-primary/30" : "",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <StepBadge n={i + 1} active={active} hub={step.hub} />
              <span className={active ? "font-medium" : ""}>{step.short}</span>
            </Link>
            {i < FLOW_STEPS.length - 1 && (
              <ChevronRight
                className="mx-0.5 h-4 w-4 shrink-0 text-foreground/30"
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepBadge({ n, active, hub }: { n: number; active: boolean; hub?: boolean }) {
  return (
    <span
      className={[
        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
        active
          ? "bg-primary text-primary-foreground"
          : hub
            ? "bg-primary/25 text-primary"
            : "bg-surface text-foreground/70",
      ].join(" ")}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

function HubTag() {
  return (
    <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
      Hub
    </span>
  );
}
