import { Map as MapIcon } from "lucide-react";
import type { DisasterKind } from "./DisasterPicker";

interface Props {
  disaster: DisasterKind;
}

export function MapPanel({ disaster }: Props) {
  return (
    <section
      aria-label="Map"
      className="overflow-hidden rounded-2xl bg-card text-card-foreground shadow-md shadow-black/10"
    >
      <div className="flex items-center justify-between border-b border-card-foreground/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Neighborhood map</h3>
        </div>
        <ul className="flex flex-wrap items-center gap-3 text-[11px] text-card-foreground/70">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[color:var(--severity-low)]" aria-hidden="true" />
            Best route
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[color:var(--severity-moderate)]" aria-hidden="true" />
            Caution
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[color:var(--severity-critical)]" aria-hidden="true" />
            Blocked
          </li>
        </ul>
      </div>
      <div
        className="relative flex h-72 items-center justify-center bg-[linear-gradient(135deg,oklch(0.92_0.02_220),oklch(0.85_0.03_225))] text-card-foreground/60"
        role="img"
        aria-label="Map placeholder"
      >
        {disaster === "Earthquake" ? (
          <p className="max-w-md px-6 text-center text-sm">
            Current guidance is to shelter in place during shaking. Route appears only after
            shaking stops if the building is unsafe.
          </p>
        ) : (
          <p className="text-sm font-medium">Map renders here</p>
        )}
      </div>
    </section>
  );
}
