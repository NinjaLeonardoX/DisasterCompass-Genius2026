import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FLOOD_POLYGON, MAP_CENTER, MAP_ZOOM } from "@/data/seed";
import { useHousehold, useLocation } from "@/components/LocationContext";
import {
  ASSEMBLY_POINT,
  FAULT_LINE_BAND,
  HAZARD_RISKS,
  SEVERITY_META,
  WUI_EDGE,
  type HazardZone,
} from "@/data/prepare";

// Client-only CALM risk map for the Prepare phase. Deliberately muted and
// route-free so it reads clearly differently from the Respond alert map: the
// tiles are desaturated (see .prepare-risk-map in styles.css), hazard zones are
// shaded by severity at low opacity, and no evacuation route is drawn. Lazy
// imported (see PreparePhase) so Leaflet's `window` access never runs in SSR.

const ZONE_GEOMETRY: Record<Exclude<HazardZone, null>, [number, number][]> = {
  flood: FLOOD_POLYGON,
  fault: FAULT_LINE_BAND,
  wui: WUI_EDGE,
};

interface Props {
  selectedHazardId: string;
  onSelectHazard: (id: string) => void;
}

export default function PrepareRiskMap({ selectedHazardId, onSelectHazard }: Props) {
  const household = useHousehold();
  const { activeAddress } = useLocation();
  const markerLabel = activeAddress?.name ?? "Your location";
  const zonedHazards = HAZARD_RISKS.filter((h) => h.zone !== null);
  const center: [number, number] =
    household.lat && household.lng ? [household.lat, household.lng] : MAP_CENTER;

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={MAP_ZOOM}
        scrollWheelZoom={false}
        className="prepare-risk-map"
        style={{ height: "380px", width: "100%", borderRadius: "1rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hazard zones — shaded by severity, muted. No routes. */}
        {zonedHazards.map((h) => {
          const color = SEVERITY_META[h.severity].color;
          const selected = h.id === selectedHazardId;
          return (
            <Polygon
              key={h.id}
              positions={ZONE_GEOMETRY[h.zone as Exclude<HazardZone, null>]}
              pathOptions={{
                color: `color-mix(in srgb, ${color} 70%, #64748B)`,
                weight: selected ? 2 : 1,
                opacity: selected ? 0.8 : 0.45,
                fillColor: color,
                fillOpacity: selected ? 0.28 : 0.14,
                dashArray: selected ? undefined : "5 6",
              }}
              eventHandlers={{ click: () => onSelectHazard(h.id) }}
            >
              <Tooltip>{`${h.shortLabel} risk — ${SEVERITY_META[h.severity].label}`}</Tooltip>
            </Polygon>
          );
        })}

        {/* Home marker — muted slate, no alert styling */}
        <CircleMarker
          center={[household.lat, household.lng]}
          radius={8}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#475569", fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            🏠 {markerLabel}
          </Tooltip>
        </CircleMarker>

        {/* Post-shaking assembly point (off the fault line) */}
        <CircleMarker
          center={[ASSEMBLY_POINT.lat, ASSEMBLY_POINT.lng]}
          radius={7}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#0F766E", fillOpacity: 0.9 }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            🟢 {ASSEMBLY_POINT.name} — assembly area
          </Tooltip>
        </CircleMarker>
      </MapContainer>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-xl bg-background/90 p-3 text-xs text-foreground shadow-lg backdrop-blur">
        <p className="mb-2 font-semibold">Risk map · no active route</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: SEVERITY_META.high.color, opacity: 0.5 }}
            />
            Flood zone — high
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: SEVERITY_META.low.color, opacity: 0.5 }}
            />
            Fault band · WUI edge — low
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#475569" }} />
            Your home
          </li>
        </ul>
      </div>
    </div>
  );
}
