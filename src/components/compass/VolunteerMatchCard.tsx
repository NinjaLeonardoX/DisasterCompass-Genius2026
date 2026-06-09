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
    <section
      className={[
        "dc-card dc-hover-lift p-5 text-card-foreground",
        volunteerApproved ? "dc-glow-green border-[color:var(--severity-low)]/30" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
            Volunteer match
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">Ana</h3>
        </div>
        {volunteerApproved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--severity-low)]/15 px-2.5 py-1 text-xs font-semibold text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/30">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Approved
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-[color:var(--severity-moderate)]/15 px-2.5 py-1 text-xs font-semibold text-[color:var(--severity-moderate)] ring-1 ring-[color:var(--severity-moderate)]/30">
            Awaiting approval
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
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[color:var(--severity-low)]/12 px-3 py-2 text-sm font-medium text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/25">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Ana En Route via Route B
        </p>
      ) : (
        <button
          type="button"
          onClick={onApprove}
          className="dc-hover-lift mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[color:var(--severity-low)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(22,163,74,0.7)] hover:brightness-105"
        >
          Approve volunteer route
        </button>
      )}
    </section>
  );
}
