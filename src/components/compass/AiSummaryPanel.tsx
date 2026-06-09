import { Sparkles } from "lucide-react";

interface Props {
  simplified: boolean;
  onToggle: (v: boolean) => void;
}

const FULL =
  "Because the Rivera family is in a flood-risk area, has no vehicle, and includes an elderly person, toddler, pet, and medical needs, DisasterCompass recommends going to higher ground using Route B. Route A is rejected because it crosses a flooded bridge. Ana is the recommended volunteer match, pending coordinator approval.";
const SIMPLE =
  "Go to Hilltop Community Center. Do not use River Road bridge. Ana can help with a truck if the coordinator approves.";

export function AiSummaryPanel({ simplified, onToggle }: Props) {
  return (
    <section className="rounded-2xl bg-card p-5 text-card-foreground shadow-md shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-base font-semibold">Plain-language summary</h3>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-card-foreground/75">
          <input
            type="checkbox"
            checked={simplified}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 rounded border-card-foreground/30 text-primary focus:ring-primary"
          />
          Simplified wording
        </label>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-card-foreground/90">
        {simplified ? SIMPLE : FULL}
      </p>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-card-foreground/55">
        AI explains the plan; rules decide it.
      </p>
    </section>
  );
}
