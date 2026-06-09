import { Droplets, Activity, Flame, Wind, Sun } from "lucide-react";

export type DisasterKind =
  | "Flood"
  | "Earthquake"
  | "Wildfire"
  | "Hurricane"
  | "Extreme Heat";

export const DISASTERS: { kind: DisasterKind; Icon: typeof Droplets }[] = [
  { kind: "Flood", Icon: Droplets },
  { kind: "Earthquake", Icon: Activity },
  { kind: "Wildfire", Icon: Flame },
  { kind: "Hurricane", Icon: Wind },
  { kind: "Extreme Heat", Icon: Sun },
];

interface Props {
  selected: DisasterKind;
  onSelect: (k: DisasterKind) => void;
}

export function DisasterPicker({ selected, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Select disaster type"
      className="flex flex-wrap gap-2"
    >
      {DISASTERS.map(({ kind, Icon }) => {
        const active = kind === selected;
        return (
          <button
            key={kind}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(kind)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-white shadow-sm"
                : "border-border bg-white text-[color:var(--muted-foreground)] hover:border-slate-300 hover:text-[color:var(--foreground)]",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {kind}
          </button>
        );
      })}
    </div>
  );
}
