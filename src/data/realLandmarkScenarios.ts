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

  // 2 — Stanford University
  {
    id: "stanford-earthquake",
    landmark: "Stanford University — Main Quad",
    address: "450 Jane Stanford Way, Stanford, CA 94305",
    origin: { lat: 37.4275, lng: -122.1697 },
    region: "Stanford / San Francisco Peninsula, CA",
    hazard: "earthquake",
    scenario:
      "M7+ on the San Andreas (~4 mi west of campus). Shaking 30–60 sec; aftershocks expected.",
    firstAction:
      "Drop, Cover, Hold On indoors. Do NOT run outside during shaking. Move to assembly area only after shaking stops.",
    destination: {
      name: "Main Quad Oval (designated outdoor assembly area)",
      address: "Palm Dr at Jane Stanford Way, Stanford, CA",
      type: "Outdoor assembly area (away from buildings)",
      coords: { lat: 37.4302, lng: -122.1696 },
    },
    route: [
      { lat: 37.4275, lng: -122.1697, via: "Exit building via nearest safe stairwell (no elevators)" },
      { lat: 37.4285, lng: -122.1697, via: "Jane Stanford Way (stay clear of facades + glass)" },
      { lat: 37.4302, lng: -122.1696, via: "Palm Drive Oval — open ground" },
    ],
    distanceMiles: 0.2,
    estimatedMinutes: 6,
    rationale:
      "CardinalReady guidance: post-shaking, evacuate to open ground away from buildings, trees, and power lines. The Oval is the closest large open assembly area.",
    rejected: {
      name: "Drive off-campus via El Camino Real",
      reason: "Roads/overpasses may be damaged; emergency vehicles need lanes clear immediately after the quake.",
    },
    sources: [
      "https://cardinalready.stanford.edu/emergency/earthquake/",
      "https://cardinalready.stanford.edu/emergency/evacuation-procedure/",
      "https://ehs.stanford.edu/manual/emergency-response-guidelines/earthquake",
    ],
  },

  // 3 — Tulane University
  {
    id: "tulane-hurricane",
    landmark: "Tulane University — Gibson Hall",
    address: "6823 St Charles Ave, New Orleans, LA 70118",
    origin: { lat: 29.9404, lng: -90.1206 },
    region: "New Orleans, LA",
    hazard: "hurricane",
    scenario:
      "Major hurricane (Cat 3+) forecast landfall <72 hours. Tulane evacuation order issued; mandatory parish evacuation likely.",
    firstAction:
      "Depart before the mandatory-evacuation deadline. If no vehicle, report to nearest City-Assisted Evacuation (Evacuspot).",
    destination: {
      name: "Smoothie King Center Evacuspot → State shelter",
      address: "1501 Dave Dixon Dr, New Orleans, LA 70113",
      type: "City-Assisted Evacuation pickup (Evacuspot)",
      coords: { lat: 29.9489, lng: -90.0817 },
    },
    route: [
      { lat: 29.9404, lng: -90.1206, via: "St. Charles Ave NE (Tulane shuttle to Evacuspot)" },
      { lat: 29.9486, lng: -90.0699, via: "Loyola Ave" },
      { lat: 29.9489, lng: -90.0817, via: "Dave Dixon Dr — Smoothie King Center" },
    ],
    distanceMiles: 3.4,
    estimatedMinutes: 18,
    rationale:
      "Tulane Emergency Preparedness directs students without transport to City-Assisted Evacuation; Evacuspots bus riders to state shelters outside the surge zone.",
    rejected: {
      name: "Stay in dorm on St. Charles Ave",
      reason: "Campus closes; surge + power loss expected; mandatory evacuation supersedes shelter-in-place.",
    },
    sources: [
      "https://emergencyprep.tulane.edu/preparing-storm",
      "https://emergencyprep.tulane.edu/city-assisted-evacuation",
      "https://emergencyprep.tulane.edu/responding-to-the-storm",
    ],
  },

  // 4 — University of Miami
  {
    id: "umiami-hurricane-surge",
    landmark: "University of Miami — Coral Gables Campus",
    address: "1320 S Dixie Hwy, Coral Gables, FL 33146",
    origin: { lat: 25.7211, lng: -80.2792 },
    region: "Coral Gables / Miami, FL",
    hazard: "hurricane",
    scenario:
      "Cat 4 hurricane projected to track over South Florida; storm-surge inundation predicted east of US-1.",
    firstAction:
      "Follow UM Hurricane Plan: secure lab/office, then evacuate inland before tropical-storm-force winds arrive.",
    destination: {
      name: "Miami-Dade EOC-designated inland shelter (Florida City area)",
      address: "Homestead/Florida City inland shelter zone, FL",
      type: "County-designated hurricane shelter (inland)",
      coords: { lat: 25.4687, lng: -80.4776 },
    },
    route: [
      { lat: 25.7211, lng: -80.2792, via: "S Dixie Hwy / US-1 south" },
      { lat: 25.5085, lng: -80.4067, via: "Florida's Turnpike south" },
      { lat: 25.4687, lng: -80.4776, via: "Florida City inland shelter" },
    ],
    distanceMiles: 33,
    estimatedMinutes: 55,
    rationale:
      "UM Hurricane Preparedness directs residents to follow Miami-Dade evacuation orders; inland routes via the Turnpike avoid the coastal surge zone east of US-1.",
    rejected: {
      name: "Shelter in coastal high-rise on Brickell",
      reason: "Inside Miami-Dade Storm Surge Planning Zone A; surge + facade-glass risk in Cat 4 winds.",
    },
    sources: [
      "https://prepare.miami.edu/before-emergency/hurricane-preparedness/index.html",
      "https://prepare.miami.edu/weathering-the-storm.pdf",
    ],
  },

  // 5 — Paradise, CA (Camp Fire scenario)
  {
    id: "paradise-wildfire",
    landmark: "Paradise Town Hall (Paradise, CA)",
    address: "5555 Skyway, Paradise, CA 95969",
    origin: { lat: 39.7596, lng: -121.6219 },
    region: "Butte County, CA",
    hazard: "wildfire",
    scenario:
      "Wind-driven fire on the Paradise ridge (Camp Fire-style). Spot fires already inside town; evacuation order issued.",
    firstAction:
      "Evacuate immediately. Use Skyway SW toward Chico — do not return for belongings.",
    destination: {
      name: "Chico — designated evacuation center (Silver Dollar Fairgrounds)",
      address: "2357 Fair St, Chico, CA 95928",
      type: "Red Cross / county evacuation center",
      coords: { lat: 39.7196, lng: -121.8362 },
    },
    route: [
      { lat: 39.7596, lng: -121.6219, via: "Skyway SW (primary egress artery)" },
      { lat: 39.7517, lng: -121.6951, via: "Skyway through Upper Skyway zone" },
      { lat: 39.7282, lng: -121.7762, via: "Skyway into Chico" },
      { lat: 39.7196, lng: -121.8362, via: "Fair St — Silver Dollar Fairgrounds" },
    ],
    distanceMiles: 14,
    estimatedMinutes: 32,
    rationale:
      "NIST NETTRA case study of the Camp Fire shows Skyway SW was the highest-capacity egress artery; Pentz Rd and Clark Rd closed earliest under ember attack.",
    rejected: {
      name: "Pentz Rd east",
      reason: "Closed early in the 2018 Camp Fire by ember showers and spot fires; lower-capacity route into the fire front.",
    },
    sources: [
      "https://www.nist.gov/document/paradise-ur-map",
      "https://escape.nist.gov/evacuation3AddressingFailuresEgresslearnmore1",
    ],
  },

  // 6 — Space Needle (Seattle)
  {
    id: "space-needle-cascadia",
    landmark: "Space Needle (Seattle, WA)",
    address: "400 Broad St, Seattle, WA 98109",
    origin: { lat: 47.6205, lng: -122.3493 },
    region: "Seattle, WA",
    hazard: "earthquake",
    scenario:
      "Cascadia Subduction Zone M9 — long-duration shaking (3–5 min). Tsunami threat to Puget Sound shoreline; liquefaction risk along SR-99 viaduct corridor.",
    firstAction:
      "Drop, Cover, Hold On inside the Needle base. After shaking, move to Seattle Center open lawns — away from glass and tall structures.",
    destination: {
      name: "Seattle Center — Fisher Pavilion Lawn (open assembly)",
      address: "305 Harrison St, Seattle, WA 98109",
      type: "Outdoor assembly area",
      coords: { lat: 47.6213, lng: -122.3499 },
    },
    route: [
      { lat: 47.6205, lng: -122.3493, via: "Exit Space Needle base; avoid glass overhangs" },
      { lat: 47.6209, lng: -122.3497, via: "Broad St walkway through Seattle Center" },
      { lat: 47.6213, lng: -122.3499, via: "Fisher Pavilion lawn — open ground" },
    ],
    distanceMiles: 0.15,
    estimatedMinutes: 4,
    rationale:
      "FEMA Region 10 CSZ plan and NVS tsunami evacuation guidance: stay on high ground (Seattle Center is ~150 ft elev., outside tsunami inundation zones); use open assembly areas after shaking.",
    rejected: {
      name: "Drive south on Alaskan Way",
      reason: "Inside modeled Puget Sound tsunami inundation zone; liquefaction risk on filled waterfront.",
    },
    sources: [
      "https://mil.wa.gov/asset/62bc6bf87b6dc",
      "https://nvs.nanoos.org/TsunamiEvac",
    ],
  },

  // 7 — Griffith Observatory (LA)
  {
    id: "griffith-wildfire",
    landmark: "Griffith Observatory (Los Angeles, CA)",
    address: "2800 E Observatory Rd, Los Angeles, CA 90027",
    origin: { lat: 34.1184, lng: -118.3004 },
    region: "Los Angeles, CA",
    hazard: "wildfire",
    scenario:
      "Brush fire in Griffith Park (2018 #GriffithParkFire-style). Visitor evacuation order from LAFD.",
    firstAction:
      "Walk to vehicle calmly; descend via Observatory Rd to Vermont Ave south — away from the fire's upslope path.",
    destination: {
      name: "Los Feliz / Sunset Blvd assembly area (out of brush zone)",
      address: "Sunset Blvd & Vermont Ave, Los Angeles, CA 90027",
      type: "Urban out-of-WUI assembly area",
      coords: { lat: 34.0976, lng: -118.2918 },
    },
    route: [
      { lat: 34.1184, lng: -118.3004, via: "E Observatory Rd downhill" },
      { lat: 34.1136, lng: -118.2992, via: "N Vermont Canyon Rd south" },
      { lat: 34.1042, lng: -118.2918, via: "N Vermont Ave south through Los Feliz" },
      { lat: 34.0976, lng: -118.2918, via: "Sunset Blvd & Vermont — urban grid" },
    ],
    distanceMiles: 2.3,
    estimatedMinutes: 12,
    rationale:
      "WildfireLA + LAFD evacuation guidance: leave wildland-urban interface downslope, away from fire-driving winds; reach the urban street grid where engines have access.",
    rejected: {
      name: "Mt. Hollywood Dr upslope",
      reason: "Moves uphill into the brush zone and limits LAFD ingress; single-lane fire road.",
    },
    sources: [
      "https://www.lafd.org/alert/griffithparkfire-brush-fire-07102018",
      "https://www.wildfirela.org/go/",
      "https://griffithobservatory.lacity.gov/visit/getting-here/",
    ],
  },

  // 8 — Joplin High School (Tornado)
  {
    id: "joplin-tornado",
    landmark: "Joplin High School (Joplin, MO)",
    address: "2104 Indiana Ave, Joplin, MO 64804",
    origin: { lat: 37.0598, lng: -94.5028 },
    region: "Joplin, MO",
    hazard: "tornado",
    scenario:
      "PDS Tornado Warning, confirmed wedge tornado SW of town (2011 EF5-style track).",
    firstAction:
      "Move immediately to the Community Safe Room. Do not attempt to drive — tornadoes outrun cars.",
    destination: {
      name: "Joplin High School Community Safe Room (FEMA P-361)",
      address: "2104 Indiana Ave, Joplin, MO 64804",
      type: "FEMA-rated community safe room (on-site)",
      coords: { lat: 37.0599, lng: -94.5029 },
    },
    route: [
      { lat: 37.0598, lng: -94.5028, via: "Interior corridor to Safe Room entrance" },
      { lat: 37.0599, lng: -94.5029, via: "Safe Room doors (auto-unlock on NWS warning)" },
    ],
    distanceMiles: 0.05,
    estimatedMinutes: 2,
    rationale:
      "Joplin Schools' Community Safe Rooms (built post-2011 with FEMA grant) auto-unlock on NWS Tornado Warning and are designed to FEMA P-361 safe-room standards.",
    rejected: {
      name: "Shelter in classroom on exterior wall",
      reason: "Standard classrooms are not rated for EF4-EF5 winds; safe room is engineered for it.",
    },
    sources: [
      "https://jhs.joplinschools.org/58621_2",
      "https://joplinschools.org/55547_2",
      "https://www.joplinschools.org/38844_3",
    ],
  },

  // 9 — Hawai'i Volcanoes National Park
  {
    id: "kilauea-volcano",
    landmark: "Hawai'i Volcanoes National Park HQ (Kīlauea Visitor Center)",
    address: "1 Crater Rim Dr, Hawaii National Park, HI 96718",
    origin: { lat: 19.4294, lng: -155.2569 },
    region: "Big Island, HI",
    hazard: "volcano",
    scenario:
      "Kīlauea summit eruption episode escalates — Volcano Alert Level WARNING, Aviation Color RED. Tephra fallout reported at overlooks; Highway 11 closures issued.",
    firstAction:
      "Evacuate the park immediately via Highway 11 east toward Hilo. Stay upwind of vog/ashfall.",
    destination: {
      name: "Hilo — Afook-Chinen Civic Auditorium (county shelter)",
      address: "323 Manono St, Hilo, HI 96720",
      type: "County emergency shelter (Hawaiʻi County Civil Defense)",
      coords: { lat: 19.7172, lng: -155.0855 },
    },
    route: [
      { lat: 19.4294, lng: -155.2569, via: "Crater Rim Dr to Hwy 11" },
      { lat: 19.5159, lng: -155.1854, via: "Hwy 11 NE through Volcano village" },
      { lat: 19.6502, lng: -155.1027, via: "Hwy 11 NE through Kea'au" },
      { lat: 19.7172, lng: -155.0855, via: "Manono St — Civic Auditorium" },
    ],
    distanceMiles: 30,
    estimatedMinutes: 50,
    rationale:
      "HVO/Hawaiʻi County Civil Defense + Big Island Video News (Mar 2026 update) advise leaving rift-zone proximity via Highway 11; Hilo civic shelters open during volcanic emergencies.",
    rejected: {
      name: "Chain of Craters Rd south",
      reason: "Descends toward active rift zone and historical lava-flow paths; can be cut off by new flows.",
    },
    sources: [
      "https://www.bigislandvideonews.com/2026/03/10/kilauea-volcano-warning-highway-11-national-park-closures/",
      "https://hilo.hawaii.edu/natural-hazards/volcanoes/evacuating.php",
      "https://hidot.hawaii.gov/wp-content/uploads/2018/06/Upper-Puna-Road-Evacuation-Route.pdf",
    ],
  },

  // 10 — Phoenix (Extreme Heat)
  {
    id: "phoenix-heat",
    landmark: "Arizona State Capitol (Phoenix, AZ)",
    address: "1700 W Washington St, Phoenix, AZ 85007",
    origin: { lat: 33.4483, lng: -112.0966 },
    region: "Phoenix, AZ",
    hazard: "heat",
    scenario:
      "Excessive Heat Warning: forecast 118°F. Elevated risk for unhoused, elderly, and power-dependent medical residents.",
    firstAction:
      "Move heat-vulnerable people to the city's 24/7 Respite Center before peak afternoon hours.",
    destination: {
      name: "City of Phoenix 24/7 Heat Respite Center",
      address: "20 W Jackson St, Phoenix, AZ 85003",
      type: "24/7 cooling + hydration center",
      coords: { lat: 33.4475, lng: -112.0737 },
    },
    route: [
      { lat: 33.4483, lng: -112.0966, via: "W Washington St east" },
      { lat: 33.4484, lng: -112.085, via: "S 7th Ave / W Jefferson" },
      { lat: 33.4475, lng: -112.0737, via: "W Jackson St — Respite Center entrance" },
    ],
    distanceMiles: 1.4,
    estimatedMinutes: 7,
    rationale:
      "City of Phoenix Heat Response (2025–2026): the Jackson St respite site is open 24/7 with cooling, hydration, and charging — the canonical destination for heat-vulnerable residents downtown.",
    rejected: {
      name: "Wait until evening to move",
      reason: "Heat illness compounds across the afternoon; power-dependent devices fail first on grid stress.",
    },
    sources: [
      "https://www.phoenix.gov/newsroom/heat-news/heat-relief-sites-open-may-1.html",
      "https://www.phoenix.gov/newsroom/heat-news/city-of-phoenix-opens-heat-relief-locations-to-keep-residents-sa.html",
      "https://www.kjzz.org/kjzz-news/2026-05-01/phoenixs-24-7-heat-relief-site-opens-doors-for-3rd-year-in-a-row",
    ],
  },
];

/** Convenience: lookup by id. */
export const SCENARIO_BY_ID: Record<string, RealLandmarkScenario> =
  Object.fromEntries(REAL_LANDMARK_SCENARIOS.map((s) => [s.id, s]));
