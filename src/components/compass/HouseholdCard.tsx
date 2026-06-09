import { Users, Baby, PawPrint, Car, Stethoscope, Accessibility, UserRound } from "lucide-react";

interface Props {
  onGeneratePlan?: () => void;
}

const ATTRS = [
  { Icon: Users, label: "5 people" },
  { Icon: UserRound, label: "Elderly 1" },
  { Icon: Baby, label: "Toddler 1" },
  { Icon: PawPrint, label: "Pet 1" },
  { Icon: Car, label: "No vehicle" },
  { Icon: Stethoscope, label: "Medical needs" },
  { Icon: Accessibility, label: "Accessibility needs" },
];

export function HouseholdCard({ onGeneratePlan }: Props) {
  return (
    <section className="rounded-2xl bg-card p-5 text-card-foreground shadow-md shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-card-foreground/60">
            Household
          </p>
          <h2 className="mt-1 text-xl font-semibold">Rivera Family</h2>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {ATTRS.map(({ Icon, label }) => (
          <li
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full bg-card-foreground/5 px-2.5 py-1 text-xs text-card-foreground/85"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onGeneratePlan}
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
      >
        Generate My Compass Plan
      </button>
    </section>
  );
}
