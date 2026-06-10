import { RollupPanel } from "../RollupPanel";

// Prepare phase content. The risk map + hazard list now live inside the
// Saved Safety Location card (SafetyLocationPanel "Risk map" tab), so this
// component is just the phase header, drill-mode banner, and rollup.

export function PreparePhase() {
  return (
    <div className="space-y-6">
      <RollupPanel />
    </div>
  );
}
