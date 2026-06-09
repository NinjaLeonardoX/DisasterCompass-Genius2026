import { Users, Baby, PawPrint, Car, Stethoscope, Accessibility, UserRound } from "lucide-react";

interface Props {
  onGeneratePlan?: () => void;
}

const ATTRS = [
  { Icon: Users, label: "5 people" },
  { Icon: UserRound, label: "Elderly 1" },
  { Icon: Baby, label: "Toddler 1" },
  { Icon: PawPrint, label: "Pet 1" },
  { Icon: Car, label: "No vehicle", warn: true },
  { Icon: Stethoscope, label: "Medical needs" },
  { Icon: Accessibility, label: "Accessibility needs" },
];

export function HouseholdCard({ onGeneratePlan }: Props) {
  return (
    <section className="dc-card dc-hover-lift p-5 text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
            Household
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Rivera Family</h2>
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Profile
        </span>
      </div>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {ATTRS.map(({ Icon, label, warn }) => (
          <li
            key={label}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
              warn
                ? "bg-[color:var(--severity-moderate)]/12 text-[color:var(--severity-moderate)] ring-[color:var(--severity-moderate)]/30"
                : "bg-slate-50 text-card-foreground/85 ring-border",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onGeneratePlan}
        className="dc-hover-lift mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[color:var(--foreground)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-12px_rgba(15,23,42,0.6)] ring-1 ring-white/10 hover:bg-[color:var(--foreground)]/95 hover:shadow-[0_14px_30px_-12px_rgba(22,163,74,0.55)]"
      >
        Generate My Compass Plan
      </button>
    </section>
  );
}
