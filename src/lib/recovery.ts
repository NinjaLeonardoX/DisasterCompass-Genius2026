import type { DisasterType, RecoveryItem } from "@/types";

// Pure recovery-checklist engine. Returns the eight standard post-disaster
// recovery steps. The list is the same across disaster types in this demo, but
// the signature takes the disaster type so it can be specialized later without
// changing call sites.
export function getRecoveryChecklist(_disasterType: DisasterType): RecoveryItem[] {
  return [
    { id: "rec-1", label: "Confirm everyone is safe", category: "safety", completed: false },
    { id: "rec-2", label: "Photograph damage", category: "documentation", completed: false },
    { id: "rec-3", label: "Save receipts", category: "documentation", completed: false },
    { id: "rec-4", label: "Contact insurance", category: "assistance", completed: false },
    {
      id: "rec-5",
      label: "Apply for disaster assistance if eligible",
      category: "assistance",
      completed: false,
    },
    { id: "rec-6", label: "Request cleanup support", category: "assistance", completed: false },
    {
      id: "rec-7",
      label: "Check family wellbeing and stress",
      category: "wellbeing",
      completed: false,
    },
    {
      id: "rec-8",
      label: "Follow official local guidance before returning home",
      category: "safety",
      completed: false,
    },
  ];
}
