import { CheckSquare } from "lucide-react";

const CHECKLIST = [
  "Confirm everyone is safe",
  "Photograph damage",
  "Save receipts",
  "Contact insurance",
  "Apply for disaster assistance if eligible",
  "Request cleanup support",
  "Check family wellbeing and stress",
  "Follow official local guidance before returning home",
];

const RESOURCES = [
  { label: "Ready.gov", href: "https://www.ready.gov" },
  { label: "Red Cross Shelters", href: "https://www.redcross.org/get-help/disaster-relief-and-recovery-services/find-an-open-shelter.html" },
  { label: "FEMA Disaster Assistance", href: "https://www.disasterassistance.gov" },
  { label: "Crisis Cleanup", href: "https://crisiscleanup.org" },
  { label: "Local Emergency Management", href: "#" },
];

export function RecoveryPanel() {
  return (
    <section className="rounded-2xl bg-card p-5 text-card-foreground shadow-md shadow-black/10">
      <h3 className="text-base font-semibold">Recovery Action Plan</h3>
      <ul className="mt-3 space-y-2">
        {CHECKLIST.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-card-foreground/90">
            <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-5 border-t border-card-foreground/10 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-card-foreground/60">
          Resources
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {RESOURCES.map((r) => (
            <li key={r.label}>
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-card-foreground/5 px-3 py-1 text-xs font-medium text-card-foreground/85 hover:bg-card-foreground/10"
              >
                {r.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
