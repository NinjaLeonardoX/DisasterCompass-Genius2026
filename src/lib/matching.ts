import type { Household, Volunteer, VolunteerMatch } from "@/types";

// Pure volunteer-matching engine.
//
// Priority order (highest weight first):
//   1. Available now            — an unavailable volunteer can't help right now
//   2. Enough seats             — must fit the whole household
//   3. Truck / van              — larger vehicle is more flexible
//   4. Can transport pets       — when the household has pets
//   5. Can support accessibility — when the household needs it
//   6. Shorter distance         — closer arrives sooner
//
// Weights are spaced so a higher-priority factor always outranks the sum of the
// lower ones, which guarantees a stable, explainable ranking.
const WEIGHTS = {
  available: 1000,
  enoughSeats: 400,
  largeVehicle: 200,
  pets: 120,
  accessibility: 100,
  distance: 50, // multiplied by a 0–1 closeness factor
} as const;

const MAX_DISTANCE_MILES = 10;

interface ScoredVolunteer {
  volunteer: Volunteer;
  score: number;
  reasons: string[];
}

function scoreVolunteer(household: Household, volunteer: Volunteer): ScoredVolunteer {
  let score = 0;
  const reasons: string[] = [];

  if (volunteer.available) {
    score += WEIGHTS.available;
    reasons.push("Available now");
  } else {
    reasons.push("Not available right now");
  }

  const enoughSeats = volunteer.seats >= household.people;
  if (enoughSeats) {
    score += WEIGHTS.enoughSeats;
    reasons.push(`Seats ${volunteer.seats} ≥ household of ${household.people}`);
  } else {
    reasons.push(`Only ${volunteer.seats} seats for a household of ${household.people}`);
  }

  if (volunteer.vehicle === "truck" || volunteer.vehicle === "van") {
    score += WEIGHTS.largeVehicle;
    reasons.push(`${volunteer.vehicle} has flexible capacity`);
  }

  if (household.pets > 0 && volunteer.canTransportPets) {
    score += WEIGHTS.pets;
    reasons.push("Can transport pets");
  }

  if (household.accessibilityNeeds && volunteer.canSupportAccessibility) {
    score += WEIGHTS.accessibility;
    reasons.push("Supports accessibility needs");
  }

  const closeness = Math.max(0, 1 - volunteer.distanceMiles / MAX_DISTANCE_MILES);
  score += Math.round(closeness * WEIGHTS.distance);
  reasons.push(`${volunteer.distanceMiles.toFixed(1)} mi away`);

  return { volunteer, score, reasons };
}

export function matchVolunteer(household: Household, volunteers: Volunteer[]): VolunteerMatch {
  if (volunteers.length === 0) {
    return { bestVolunteer: null, matchScore: 0, matchReasons: [] };
  }

  const ranked = volunteers
    .map((v) => scoreVolunteer(household, v))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  return {
    bestVolunteer: best.volunteer,
    matchScore: best.score,
    matchReasons: best.reasons,
  };
}
