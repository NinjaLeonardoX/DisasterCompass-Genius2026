import { Truck, MapPin, Clock, PawPrint, Accessibility, CheckCircle2 } from "lucide-react";

interface Props {
  volunteerApproved: boolean;
  onApprove: () => void;
}

const FACTS = [
  { Icon: Truck, label: "Truck · 4 seats" },
  { Icon: MapPin, label: "1.2 miles away" },
  { Icon: Clock, label: "Available now" },
  { Icon: PawPrint, label: "Can transport pet" },
  { Icon: Accessibility, label: "Can support accessibility" },
];

export function VolunteerMatchCard({ volunteerApproved, onApprove }: Props) {
  return (
    <section className="rounded-2xl bg-card p-5 text-card-foreground shadow-md shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-card-foreground/60">
            Volunteer match
          </p>
          <h3 className="mt-1 text-lg font-semibold">Ana</h3>
        </div>
        {volunteerApproved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--severity-low)]/15 px-2.5 py-1 text-xs font-semibold text-[color:var(--severity-low)]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Approved
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-[color:var(--severity-moderate)]/15 px-2.5 py-1 text-xs font-semibold text-[color:var(--severity-moderate)]">
            Awaiting coordinator approval
          </span>
        )}
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
        {FACTS.map(({ Icon, label }) => (
          <li key={label} className="flex items-center gap-2 text-card-foreground/85">
            <Icon className="h-4 w-4 text-card-foreground/55" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
      {volunteerApproved ? (
        <p className="mt-4 rounded-lg bg-[color:var(--severity-low)]/10 p-3 text-sm text-card-foreground/90">
          Ana is en route using Route B.
        </p>
      ) : (
        <button
          type="button"
          onClick={onApprove}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
        >
          Approve volunteer route
        </button>
      )}
    </section>
  );
}
