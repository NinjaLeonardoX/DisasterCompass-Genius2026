import { useMemo, useState } from "react";
import { CheckCircle2, GraduationCap, Lightbulb, RotateCcw, ArrowRight, MapPin } from "lucide-react";
import { HAZARD_RISKS, SEVERITY_META, getHazard } from "@/data/prepare";

interface Props {
  selectedHazardId: string;
  onSelectHazard: (id: string) => void;
}

type StepId = "home" | "zones" | "pick" | "route" | "quiz";

const STEPS: { id: StepId; title: string; tip: string }[] = [
  {
    id: "home",
    title: "1. Find your home",
    tip: "Look for the 🏠 marker on the map. That's your starting point for every route.",
  },
  {
    id: "zones",
    title: "2. Read the hazard zones",
    tip: "Shaded shapes are hazard zones. Darker = higher severity. Tap one on the map.",
  },
  {
    id: "pick",
    title: "3. Pick a hazard to rehearse",
    tip: "Choose any hazard. The map will draw the pre-mapped route from home to safety.",
  },
  {
    id: "route",
    title: "4. Trace the rehearsal route",
    tip: "Follow the dashed line from your home to the destination marker. Notice the streets it uses.",
  },
  {
    id: "quiz",
    title: "5. Quick check",
    tip: "Match the hazard to its safe destination.",
  },
];

export function RouteTrainingPanel({ selectedHazardId, onSelectHazard }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState<Record<StepId, boolean>>({
    home: false,
    zones: false,
    pick: false,
    route: false,
    quiz: false,
  });
  const [quizPick, setQuizPick] = useState<string | null>(null);

  const step = STEPS[stepIdx];
  const completedCount = Object.values(done).filter(Boolean).length;
  const allDone = completedCount === STEPS.length;

  // Quiz: random hazard with a destination, 3 shuffled options.
  const quiz = useMemo(() => {
    const target = getHazard(selectedHazardId);
    const others = HAZARD_RISKS.filter((h) => h.id !== target.id).slice(0, 2);
    const options = [target, ...others]
      .map((h) => ({ h, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.h);
    return { target, options };
  }, [selectedHazardId, stepIdx === 4]);

  const markDone = (id: StepId) => {
    setDone((d) => ({ ...d, [id]: true }));
  };

  const next = () => {
    markDone(step.id);
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  };

  const reset = () => {
    setStepIdx(0);
    setDone({ home: false, zones: false, pick: false, route: false, quiz: false });
    setQuizPick(null);
  };

  return (
    <div className="dc-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-card-foreground/10 bg-card-foreground/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[color:var(--severity-moderate)]" />
          <h4 className="text-sm font-bold uppercase tracking-wider">Map Route Training</h4>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className="h-1.5 w-6 rounded-full transition-colors"
                style={{
                  background: done[s.id]
                    ? "var(--severity-low)"
                    : i === stepIdx
                      ? "var(--severity-moderate)"
                      : "color-mix(in oklab, currentColor 15%, transparent)",
                }}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-card-foreground/65">
            {completedCount}/{STEPS.length}
          </span>
          <button
            type="button"
            onClick={reset}
            title="Restart training"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-card-foreground/60 hover:bg-card-foreground/10 hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm font-bold">{step.title}</p>
          <p className="mt-1 inline-flex items-start gap-1.5 text-xs text-card-foreground/75">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--severity-moderate)]" />
            {step.tip}
          </p>

          {/* Step-specific interactive content */}
          {step.id === "home" && (
            <div className="mt-3 rounded-lg bg-card-foreground/[0.04] p-3 text-xs text-card-foreground/80">
              The 🏠 icon shows your saved household. Every rehearsal route starts there.
            </div>
          )}

          {step.id === "zones" && (
            <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-3">
              {(["high", "moderate", "low"] as const).map((sev) => (
                <li
                  key={sev}
                  className="flex items-center gap-2 rounded-lg bg-card-foreground/[0.04] px-2 py-1.5"
                >
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ background: SEVERITY_META[sev].color, opacity: 0.6 }}
                  />
                  <span className="font-medium">{SEVERITY_META[sev].label}</span>
                </li>
              ))}
            </ul>
          )}

          {step.id === "pick" && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {HAZARD_RISKS.map((h) => {
                const active = h.id === selectedHazardId;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      onSelectHazard(h.id);
                      markDone("pick");
                    }}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      active
                        ? "border-foreground bg-foreground text-white"
                        : "border-border text-card-foreground/80 hover:border-foreground/50",
                    ].join(" ")}
                  >
                    {h.shortLabel}
                  </button>
                );
              })}
            </div>
          )}

          {step.id === "route" && (
            <div className="mt-3 rounded-lg bg-card-foreground/[0.04] p-3 text-xs">
              <p className="inline-flex items-center gap-1.5 font-semibold">
                <MapPin className="h-3.5 w-3.5 text-[color:var(--severity-moderate)]" />
                {getHazard(selectedHazardId).shortLabel} → {getHazard(selectedHazardId).destinationName}
              </p>
              <p className="mt-1 text-card-foreground/70">
                {getHazard(selectedHazardId).routeLine}
              </p>
            </div>
          )}

          {step.id === "quiz" && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold">
                Where should you go for a <span className="underline">{quiz.target.shortLabel}</span>?
              </p>
              <div className="grid gap-1.5 sm:grid-cols-3">
                {quiz.options.map((opt) => {
                  const correct = opt.id === quiz.target.id;
                  const picked = quizPick === opt.id;
                  const showState = quizPick !== null;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={showState}
                      onClick={() => {
                        setQuizPick(opt.id);
                        if (correct) markDone("quiz");
                      }}
                      className={[
                        "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                        showState && correct
                          ? "border-[color:var(--severity-low)] bg-[color:var(--severity-low)]/10"
                          : showState && picked && !correct
                            ? "border-[color:var(--severity-high)] bg-[color:var(--severity-high)]/10"
                            : "border-border hover:border-foreground/40",
                      ].join(" ")}
                    >
                      <p className="font-semibold">{opt.destinationName}</p>
                      <p className="text-[10px] text-card-foreground/60">{opt.destinationType}</p>
                    </button>
                  );
                })}
              </div>
              {quizPick && (
                <p className="text-[11px]">
                  {quizPick === quiz.target.id ? (
                    <span className="font-semibold text-[color:var(--severity-low)]">
                      ✓ Correct — you've got the route.
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setQuizPick(null)}
                      className="font-semibold text-[color:var(--severity-high)] underline"
                    >
                      Try again
                    </button>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Advance */}
        <div className="flex items-end justify-end">
          {allDone ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--severity-low)]/15 px-3 py-1.5 text-xs font-semibold text-[color:var(--severity-low)]">
              <CheckCircle2 className="h-3.5 w-3.5" /> Training complete
            </span>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={step.id === "quiz" && !done.quiz}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {stepIdx === STEPS.length - 1 ? "Finish" : "Got it · Next"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
