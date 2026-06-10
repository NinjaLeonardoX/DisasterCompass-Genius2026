import { useLocation } from "../LocationContext";

interface Props {
  volunteerApproved: boolean;
}

type PillTone = "critical" | "moderate" | "low" | "info";

const TONE: Record<PillTone, string> = {
  critical:
    "bg-[color:var(--severity-critical)]/15 text-[color:var(--severity-critical)]",
  moderate:
    "bg-[color:var(--severity-moderate)]/15 text-[color:var(--severity-moderate)]",
  low: "bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]",
  info: "bg-card-foreground/10 text-card-foreground/80",
};

function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}>
      {children}
    </span>
  );
}

export function CoordinatorPanel({ volunteerApproved }: Props) {
  const { resolved, household } = useLocation();
  const residenceName =
    resolved?.city ??
    resolved?.county ??
    resolved?.state ??
    household.locationName ??
    "Your residence";

  const counts = [
    { label: "Needs transport", value: 1, tone: "moderate" as PillTone },
    { label: "Unaccounted", value: 1, tone: "critical" as PillTone },
    { label: "Needs medicine", value: 1, tone: "moderate" as PillTone },
    { label: "Safe / sheltering", value: 2, tone: "low" as PillTone },
  ];

  const households: { name: string; status: string; tone: PillTone }[] = [
    {
      name: residenceName,
      status: volunteerApproved ? "En Route" : "Needs Transport",
      tone: volunteerApproved ? "low" : "moderate",
    },
    { name: "Chen", status: "Safe", tone: "low" },
    { name: "Miller", status: "Unaccounted", tone: "critical" },
    { name: "Johnson", status: "Sheltering", tone: "low" },
    { name: "Patel", status: "Needs Medicine", tone: "moderate" },
  ];

  return (
    <section className="rounded-2xl bg-card p-5 text-card-foreground shadow-md shadow-black/10">
      <h3 className="text-base font-semibold">Coordinator panel</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map((c) => (
          <div key={c.label} className="rounded-xl bg-card-foreground/5 p-3">
            <p className="text-2xl font-bold tracking-tight">{c.value}</p>
            <p className="mt-1 text-[11px] text-card-foreground/70">{c.label}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 divide-y divide-card-foreground/10">
        {households.map((h) => (
          <li key={h.name} className="flex items-center justify-between py-2.5 text-sm">
            <span className="font-medium">{h.name}</span>
            <Pill tone={h.tone}>{h.status}</Pill>
          </li>
        ))}
      </ul>
    </section>
  );
}
