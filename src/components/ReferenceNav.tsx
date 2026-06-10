import { Link } from "@tanstack/react-router";

export const REFERENCE_LINKS = [
  { to: "/compass", label: "Disaster Compass" },
  { to: "/shelters-routes", label: "Shelters & Routes" },
  { to: "/methodology", label: "Methodology" },
  { to: "/ai-disclosure", label: "AI Disclosure" },
] as const;

interface Props {
  variant?: "horizontal" | "vertical";
  onNavigate?: () => void;
}

export function ReferenceNav({ variant = "horizontal", onNavigate }: Props) {
  if (variant === "vertical") {
    return (
      <nav aria-label="Reference" className="flex flex-col gap-1">
        {REFERENCE_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            onClick={onNavigate}
            className="rounded-lg px-3 py-3 text-sm text-foreground/75 hover:bg-surface"
            activeProps={{ className: "rounded-lg px-3 py-3 text-sm bg-surface text-foreground" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Reference" className="flex items-center gap-1">
      {REFERENCE_LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="rounded-lg px-2.5 py-1.5 text-xs text-foreground/60 hover:bg-surface hover:text-foreground/90"
          activeProps={{
            className: "rounded-lg px-2.5 py-1.5 text-xs bg-surface text-foreground/90",
          }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
