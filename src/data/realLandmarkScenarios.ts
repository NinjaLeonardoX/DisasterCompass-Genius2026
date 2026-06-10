/**
 * Real-world landmark disaster scenarios for the Prepare screen.
 *
 * DATA PREPARATION ONLY — not yet wired into the UI.
 *
 * Each entry pairs a recognizable real landmark (origin) with a plausible,
 * region-appropriate hazard and a concrete pre-mapped route to a real
 * destination (shelter, cooling center, assembly area, or evacuation hub).
 *
 * Coordinates are real lat/lng (rounded to ~4 decimals, demo-grade — not
 * survey-grade). Distances/times are reasonable driving estimates, not
 * live traffic. Sources reviewed at prep time are cited per-entry under
 * `sources` so the Defensibility ("Why this?") popover can reference them.
 *
 * Hazard categories align with the existing engine: flood | heat |
 * hurricane | wildfire | earthquake — plus two real-world extensions used
 * here for landmark realism: tornado, volcano, winter-storm, tsunami.
 */

export type RealHazard =
  | "flood"
  | "heat"
  | "hurricane"
  | "wildfire"
  | "earthquake"
  | "tornado"
  | "volcano"
  | "winter-storm"
  | "tsunami";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RealRouteWaypoint extends LatLng {
  /** Human-readable street/road name for this segment. */
  via: string;
}

export interface RealLandmarkScenario {
  id: string;
  /** The landmark itself (origin of the route). */
  landmark: string;
  address: string;
  origin: LatLng;
  region: string;
  hazard: RealHazard;
  /** One-line scenario framing the user sees first. */
  scenario: string;
  /** What to do RIGHT NOW (Prepare-screen "First action"). */
  firstAction: string;
  destination: {
    name: string;
    address: string;
    type: string; // shelter | cooling center | assembly area | evacuation hub | safe room
    coords: LatLng;
  };
  /** Ordered waypoints describing the recommended route (origin → ... → destination). */
  route: RealRouteWaypoint[];
  distanceMiles: number;
  estimatedMinutes: number;
  /** Why this route is chosen over alternatives. */
  rationale: string;
  /** Routes intentionally avoided + why (for the "Rejected route" callout). */
  rejected?: { name: string; reason: string };
  /** Sources reviewed when assembling this entry. */
  sources: string[];
}

export const REAL_LANDMARK_SCENARIOS: RealLandmarkScenario[] = [
  // 1 — St. John Fisher University (requested by name)
  {
    id: "sjfu-winter-storm",
    landmark: "St. John Fisher University",
    address: "3690 East Ave, Pittsford, NY 14618",
    origin: { lat: 43.1149, lng: -77.5236 },
    region: "Rochester, NY",
    hazard: "winter-storm",
    scenario:
      "Lake-effect blizzard inbound off Lake Ontario. Whiteout conditions and travel ban likely within 6 hours.",
    firstAction:
      "Shelter in place on campus. Move residential students to interior, heated buildings before the travel ban.",
    destination: {
      name: "Student Life Center (campus warming + shelter hub)",
      address: "3690 East Ave, Pittsford, NY 14618",
      type: "On-campus shelter hub",
      coords: { lat: 43.1156, lng: -77.524 },
    },
    route: [
      { lat: 43.1149, lng: -77.5236, via: "Residential quad walkways" },
      { lat: 43.1153, lng: -77.5238, via: "Campus interior path (covered)" },
      { lat: 43.1156, lng: -77.524, via: "Student Life Center entrance" },
    ],
    distanceMiles: 0.2,
    estimatedMinutes: 5,
    rationale:
      "Campus Emergency Response Plan prioritizes shelter-in-place during severe winter weather over off-campus evacuation. Student Life Center has backup power and food service.",
    rejected: {
      name: "Drive home via I-490",
      reason: "NYS travel ban during blizzard; lake-effect bands cause sudden zero-visibility whiteouts.",
    },
    sources: [
      "https://www.sjf.edu/services/safety-and-security/emergency-response-plan/",
      "https://www.sjf.edu/book/emergency-response-plan/emergency-action-plans/",
    ],
  },

  // 2 — University of Rochester (River Campus) — Genesee River flood
  {
    id: "uofr-genesee-flood",
    landmark: "University of Rochester — River Campus (Rush Rhees Library)",
    address: "500 Joseph C Wilson Blvd, Rochester, NY 14627",
    origin: { lat: 43.1283, lng: -77.6298 },
    region: "Rochester, NY",
    hazard: "flood",
    scenario:
      "Remnants of a tropical system stall over the Genesee watershed. River gauge at Ford St projected to crest above flood stage; River Campus low-lying lots and tunnel system at risk.",
    firstAction:
      "Move vehicles out of Library Lot and Lot M (lowest elevation). Evacuate basement labs and the steam-tunnel level above the projected crest line.",
    destination: {
      name: "Goergen Athletic Center (high-ground assembly + warming)",
      address: "30 Library Rd, Rochester, NY 14627",
      type: "On-campus high-ground assembly area",
      coords: { lat: 43.1262, lng: -77.6276 },
    },
    route: [
      { lat: 43.1283, lng: -77.6298, via: "Wilson Quad walkways (away from river bluff)" },
      { lat: 43.1271, lng: -77.6285, via: "Library Rd south (above 100-yr floodplain)" },
      { lat: 43.1262, lng: -77.6276, via: "Goergen Athletic Center entrance" },
    ],
    distanceMiles: 0.3,
    estimatedMinutes: 7,
    rationale:
      "UR Public Safety flood protocol prioritizes vertical evacuation to higher campus elevations rather than crossing the Genesee. Goergen sits well above the river bluff and has backup power.",
    rejected: {
      name: "Drive off-campus via Elmwood Ave bridge",
      reason: "Elmwood Ave bridge approaches flood first as the Genesee crests; Monroe County closes river crossings during flood warnings.",
    },
    sources: [
      "https://www.publicsafety.rochester.edu/emergency/",
      "https://water.weather.gov/ahps2/hydrograph.php?gage=rocn6",
    ],
  },

  // 3 — Rochester Institute of Technology (RIT) — tornado
  {
    id: "rit-tornado",
    landmark: "Rochester Institute of Technology — Infinity Quad",
    address: "1 Lomb Memorial Dr, Rochester, NY 14623",
    origin: { lat: 43.0848, lng: -77.6738 },
    region: "Henrietta, NY (Greater Rochester)",
    hazard: "tornado",
    scenario:
      "NWS Buffalo issues a Tornado Warning for southern Monroe County. Rotation tracking NE from Caledonia toward Henrietta; RIT campus in the path within 15 minutes.",
    firstAction:
      "Shelter in interior, lowest-level corridors of the nearest academic building. Stay away from glass atriums (Gleason, Gordon Field House).",
    destination: {
      name: "Wallace Library — lower-level interior corridors",
      address: "90 Lomb Memorial Dr, Rochester, NY 14623",
      type: "Interior lowest-level shelter (best-available)",
      coords: { lat: 43.0837, lng: -77.6794 },
    },
    route: [
      { lat: 43.0848, lng: -77.6738, via: "Quarter Mile walkway (covered, interior)" },
      { lat: 43.0841, lng: -77.6766, via: "Cross under Liberal Arts bridge" },
      { lat: 43.0837, lng: -77.6794, via: "Wallace Library lower level" },
    ],
    distanceMiles: 0.4,
    estimatedMinutes: 6,
    rationale:
      "RIT Public Safety severe-weather guidance directs occupants to lowest interior level of the nearest building. Wallace Library's lower level has no exterior glass and is the closest qualifying shelter from Infinity Quad.",
    rejected: {
      name: "Drive home down Jefferson Rd",
      reason: "NWS guidance: do not attempt to outrun a tornado in a vehicle in open suburban terrain; Jefferson Rd is exposed and parallel to the projected track.",
    },
    sources: [
      "https://www.rit.edu/publicsafety/severe-weather",
      "https://www.weather.gov/buf/",
    ],
  },

  // 4 — Eastman Theatre (downtown Rochester) — winter storm power loss
  {
    id: "eastman-theatre-winter",
    landmark: "Eastman Theatre / Kodak Hall",
    address: "26 Gibbs St, Rochester, NY 14604",
    origin: { lat: 43.1572, lng: -77.6028 },
    region: "Downtown Rochester, NY",
    hazard: "winter-storm",
    scenario:
      "Lake-effect band intensifies mid-performance; RG&E reports cascading downtown outages. Heat to the theatre lost; ~2,200 patrons need a warming destination on foot.",
    firstAction:
      "Hold patrons in the lobby. Walk the orderly evacuation route 2 blocks south to the Convention Center warming shelter — do not release into unplowed streets.",
    destination: {
      name: "Joseph A. Floreano Riverside Convention Center (city warming shelter)",
      address: "123 E Main St, Rochester, NY 14604",
      type: "City-designated warming shelter",
      coords: { lat: 43.1556, lng: -77.6105 },
    },
    route: [
      { lat: 43.1572, lng: -77.6028, via: "Gibbs St south (sheltered side of street)" },
      { lat: 43.1562, lng: -77.6068, via: "E Main St west (plowed primary)" },
      { lat: 43.1556, lng: -77.6105, via: "Convention Center main entrance" },
    ],
    distanceMiles: 0.5,
    estimatedMinutes: 12,
    rationale:
      "City of Rochester opens the Convention Center as a primary warming shelter during severe winter events; the E Main St corridor is on RG&E's priority restoration grid and city snow-plow Route 1.",
    rejected: {
      name: "Disperse patrons to personal vehicles in the Eastman garage",
      reason: "Garage exits onto unplowed side streets during peak band; multiple stuck-vehicle incidents block ambulance access.",
    },
    sources: [
      "https://www.cityofrochester.gov/article.aspx?id=8589935833",
      "https://www.rge.com/outages",
    ],
  },

  // 5 — Strong National Museum of Play — hazmat shelter-in-place
  {
    id: "strong-museum-shelter",
    landmark: "Strong National Museum of Play",
    address: "1 Manhattan Square Dr, Rochester, NY 14607",
    origin: { lat: 43.1535, lng: -77.6033 },
    region: "Downtown Rochester, NY",
    hazard: "winter-storm",
    scenario:
      "Ice-storm power outage with downed lines on Chestnut St blocks evacuation routes; museum at capacity with school groups. Shelter-in-place ordered until DPW clears the corridor.",
    firstAction:
      "Move all visitors away from the atrium glass roof into the windowless Dancing Wings Butterfly Garden core and lower-level Field of Play.",
    destination: {
      name: "Strong Museum — lower-level Field of Play (interior core)",
      address: "1 Manhattan Square Dr, Rochester, NY 14607",
      type: "On-site interior shelter-in-place zone",
      coords: { lat: 43.1533, lng: -77.6031 },
    },
    route: [
      { lat: 43.1535, lng: -77.6033, via: "Move away from atrium glass" },
      { lat: 43.1534, lng: -77.6032, via: "Interior corridor to lower level" },
      { lat: 43.1533, lng: -77.6031, via: "Field of Play core (no exterior walls)" },
    ],
    distanceMiles: 0.05,
    estimatedMinutes: 4,
    rationale:
      "During an active ice/wind event with downed lines, sheltering in the interior, windowless core is safer than evacuating across iced sidewalks beneath compromised utility poles.",
    rejected: {
      name: "Evacuate west across Chestnut St to parking garage",
      reason: "Active downed-line hazard reported on Chestnut; RG&E and RPD have not cleared the corridor.",
    },
    sources: [
      "https://www.museumofplay.org/visit/",
      "https://www.cityofrochester.gov/emergencypreparedness/",
    ],
  },

  // 6 — Rochester Public Market — extreme heat
  {
    id: "rochester-public-market-heat",
    landmark: "Rochester Public Market",
    address: "280 N Union St, Rochester, NY 14609",
    origin: { lat: 43.1656, lng: -77.5933 },
    region: "Rochester, NY",
    hazard: "heat",
    scenario:
      "Excessive Heat Warning — heat index 105°F. Saturday market crowd of 20k+ exposed under partial shed roofs; vulnerable shoppers showing early heat illness.",
    firstAction:
      "Direct heat-affected shoppers to the city's nearest R-Center cooling site. Set up shaded triage at the B-Shed.",
    destination: {
      name: "David F. Gantt R-Center (city cooling site)",
      address: "700 North St, Rochester, NY 14605",
      type: "City cooling center (R-Center)",
      coords: { lat: 43.1635, lng: -77.6066 },
    },
    route: [
      { lat: 43.1656, lng: -77.5933, via: "N Union St south (shaded east side)" },
      { lat: 43.1642, lng: -77.6005, via: "Cumberland St west" },
      { lat: 43.1635, lng: -77.6066, via: "North St — Gantt R-Center entrance" },
    ],
    distanceMiles: 0.7,
    estimatedMinutes: 14,
    rationale:
      "City of Rochester activates R-Centers as cooling sites during Heat Warnings. Gantt R-Center is the closest air-conditioned, ADA-accessible city facility to the market.",
    rejected: {
      name: "Tell shoppers to drive home and self-cool",
      reason: "Hot vehicle interiors (140°F+ in minutes) worsen heat illness in already-symptomatic shoppers; medical guidance is to cool in place at the nearest indoor site.",
    },
    sources: [
      "https://www.cityofrochester.gov/r-centers/",
      "https://www.cityofrochester.gov/publicmarket/",
      "https://www.weather.gov/buf/heat",
    ],
  },

  // 7 — High Falls / Genesee Brewery district — flood
  {
    id: "high-falls-flood",
    landmark: "High Falls Overlook / Genesee Brewery",
    address: "445 St Paul St, Rochester, NY 14605",
    origin: { lat: 43.1665, lng: -77.6135 },
    region: "Rochester, NY",
    hazard: "flood",
    scenario:
      "Mt. Morris Dam releases controlled discharge upstream while heavy rain continues. Lower Falls gorge already at bank-full; pedestrian Pont de Rennes bridge closed.",
    firstAction:
      "Clear the overlook deck and brewery patio. Move uphill to St. Paul St ridge — away from the gorge rim.",
    destination: {
      name: "Edgerton R-Center (high-ground city shelter)",
      address: "41 Backus St, Rochester, NY 14608",
      type: "City R-Center / flood-event shelter",
      coords: { lat: 43.1659, lng: -77.6303 },
    },
    route: [
      { lat: 43.1665, lng: -77.6135, via: "St Paul St north (uphill, away from rim)" },
      { lat: 43.1675, lng: -77.6205, via: "Cross W Ridge Rd to Lake Ave" },
      { lat: 43.1659, lng: -77.6303, via: "Backus St — Edgerton R-Center" },
    ],
    distanceMiles: 0.9,
    estimatedMinutes: 16,
    rationale:
      "USACE Mt. Morris Dam coordinates release schedules with Monroe County OEM; Edgerton sits on the higher west-side ridge outside the gorge floodplain and opens for flood events.",
    rejected: {
      name: "Cross Pont de Rennes pedestrian bridge to east side",
      reason: "Bridge closed during high-flow events; deck spray and ice make footing hazardous over the active gorge.",
    },
    sources: [
      "https://www.lrb.usace.army.mil/Missions/Recreation/Mount-Morris-Dam/",
      "https://www.cityofrochester.gov/r-centers/",
    ],
  },

  // 8 — Greater Rochester International Airport (ROC) — winter storm
  {
    id: "roc-airport-winter",
    landmark: "Greater Rochester International Airport (ROC)",
    address: "1200 Brooks Ave, Rochester, NY 14624",
    origin: { lat: 43.1189, lng: -77.6724 },
    region: "Rochester, NY",
    hazard: "winter-storm",
    scenario:
      "FAA ground stop in effect; lake-effect band collapses visibility below RVR minimums. ~1,400 stranded passengers; hotel shuttles unable to reach the terminal curb.",
    firstAction:
      "Hold passengers in the post-security concourses (heated, food/water available). Stage Red Cross cots in Concourse B per the airport's IROPS plan.",
    destination: {
      name: "ROC Concourse B — IROPS overnight staging area",
      address: "1200 Brooks Ave, Rochester, NY 14624",
      type: "On-site IROPS contingency shelter",
      coords: { lat: 43.1194, lng: -77.6716 },
    },
    route: [
      { lat: 43.1189, lng: -77.6724, via: "Terminal central atrium" },
      { lat: 43.1192, lng: -77.6720, via: "Post-security corridor" },
      { lat: 43.1194, lng: -77.6716, via: "Concourse B gates B1–B8 (cot staging)" },
    ],
    distanceMiles: 0.15,
    estimatedMinutes: 5,
    rationale:
      "FAA-required Contingency Plan for Lengthy Tarmac Delays / IROPS keeps passengers in heated terminal space rather than dispatching curbside during a travel ban. Brooks Ave and I-390 closures make any off-airport move unsafe.",
    rejected: {
      name: "Bus passengers to downtown hotels via Brooks Ave",
      reason: "NYS travel ban on local roads + reported jackknifed trucks on I-390; hotels also at capacity from prior cancellations.",
    },
    sources: [
      "https://www2.monroecounty.gov/airport-index.php",
      "https://www.transportation.gov/airconsumer/tarmac-delay-dashboard",
    ],
  },

  // 9 — Seabreeze Amusement Park / Lake Ontario shoreline — lakeshore flood
  {
    id: "seabreeze-lakeshore-flood",
    landmark: "Seabreeze Amusement Park (Lake Ontario shoreline)",
    address: "4600 Culver Rd, Rochester, NY 14622",
    origin: { lat: 43.2381, lng: -77.5374 },
    region: "Irondequoit, NY",
    hazard: "flood",
    scenario:
      "Sustained NW gale drives Lake Ontario seiche + record IJC Plan 2014 outflow levels. Lakeshore Blvd inundated; Irondequoit Bay outlet bridge closing.",
    firstAction:
      "Evacuate the park and Culver Rd shoreline residents inland to higher ground in Irondequoit before the bay outlet bridge closes.",
    destination: {
      name: "Irondequoit Town Hall / Community Center (high-ground shelter)",
      address: "1290 Titus Ave, Rochester, NY 14617",
      type: "Town emergency shelter (high ground)",
      coords: { lat: 43.2143, lng: -77.5694 },
    },
    route: [
      { lat: 43.2381, lng: -77.5374, via: "Culver Rd south (away from shoreline)" },
      { lat: 43.2241, lng: -77.5489, via: "Pardee Rd / Cooper Rd uphill" },
      { lat: 43.2143, lng: -77.5694, via: "Titus Ave — Town Hall / Community Center" },
    ],
    distanceMiles: 2.4,
    estimatedMinutes: 11,
    rationale:
      "Monroe County OEM + Irondequoit emergency plan: during Lake Ontario high-water events, move inland and uphill before the Irondequoit Bay Outlet Bridge swings closed, which severs the primary east-west shoreline route.",
    rejected: {
      name: "Drive east along Lakeshore Blvd to Webster",
      reason: "Lakeshore Blvd is the first roadway to flood under seiche conditions and the outlet bridge closure leaves vehicles stranded between two cut sections.",
    },
    sources: [
      "https://www.irondequoit.gov/government/emergency-management",
      "https://ijc.org/en/loslrb/watershed/conditions",
    ],
  },

  // 10 — Highland Park (Lilac Festival) — severe thunderstorm
  {
    id: "highland-park-storm",
    landmark: "Highland Park — Lilac Festival main stage",
    address: "171 Reservoir Ave, Rochester, NY 14620",
    origin: { lat: 43.1342, lng: -77.6063 },
    region: "Rochester, NY",
    hazard: "tornado",
    scenario:
      "NWS Buffalo issues a Severe Thunderstorm Warning with 70 mph gusts and a Tornado Watch during festival peak attendance (~30k on the lawn).",
    firstAction:
      "Announce immediate evacuation of the open lawn. Move attendees uphill 2 blocks to the Monroe Community Hospital's interior corridors — the nearest substantial sheltered structure.",
    destination: {
      name: "Monroe Community Hospital — public lobby + interior corridors",
      address: "435 E Henrietta Rd, Rochester, NY 14620",
      type: "Substantial-structure shelter (interior)",
      coords: { lat: 43.1311, lng: -77.6126 },
    },
    route: [
      { lat: 43.1342, lng: -77.6063, via: "Reservoir Ave south (off open lawn)" },
      { lat: 43.1326, lng: -77.6098, via: "Highland Ave west to E Henrietta Rd" },
      { lat: 43.1311, lng: -77.6126, via: "E Henrietta Rd — MCH main lobby" },
    ],
    distanceMiles: 0.6,
    estimatedMinutes: 11,
    rationale:
      "NWS severe-weather guidance: open festival grounds and tents offer no protection from straight-line winds or tornadoes — move to the nearest substantial building's interior. MCH is the closest hardened structure and operates 24/7.",
    rejected: {
      name: "Shelter under the festival's vendor tents",
      reason: "Pop-up tents and stage trusses are the highest-risk structures in 70 mph winds; multiple fatalities historically at outdoor events that delayed evacuation.",
    },
    sources: [
      "https://www.weather.gov/buf/",
      "https://www.monroecounty.gov/parks-highland",
      "https://www.rochesterevents.com/lilac-festival/",
    ],
  },
];

/** Convenience: lookup by id. */
export const SCENARIO_BY_ID: Record<string, RealLandmarkScenario> =
  Object.fromEntries(REAL_LANDMARK_SCENARIOS.map((s) => [s.id, s]));
