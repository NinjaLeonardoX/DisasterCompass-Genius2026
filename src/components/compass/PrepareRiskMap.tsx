import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FLOOD_POLYGON, MAP_CENTER, MAP_ZOOM } from "@/data/seed";
import { useHousehold, useLocation } from "@/components/LocationContext";
import {
  FAULT_LINE_BAND,
  HAZARD_RISKS,
  HAZARD_ROUTES,
  SEVERITY_META,
  WUI_EDGE,
  type HazardZone,
} from "@/data/prepare";

// Client-only CALM risk map for the Prepare phase. Tiles are desaturated
// (see .prepare-risk-map in styles.css), hazard zones are shaded by severity,
// and the selected hazard's PRE-MAPPED rehearsal route is drawn from the
// household origin to its destination (derived from HAZARD_ROUTES offsets so
// it works for any saved address). Lazy imported (see PreparePhase) so
// Leaflet's `window` access never runs in SSR.

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

  const selectedHazard = HAZARD_RISKS.find((h) => h.id === selectedHazardId);
  const route = HAZARD_ROUTES[selectedHazardId];
  const routeCoords: [number, number][] | null = route
    ? route.offsets.map(([dLat, dLng]) => [center[0] + dLat, center[1] + dLng])
    : null;
  const destination = routeCoords ? routeCoords[routeCoords.length - 1] : null;

  return (
    <div className="relative">
      <MapContainer
        key={`${center[0]}-${center[1]}`}
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

        {/* Hazard zones — shaded by severity, muted. */}
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

        {/* Pre-mapped rehearsal route for the selected hazard */}
        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: route!.color,
              weight: 5,
              opacity: 0.95,
              dashArray: "8 6",
              lineCap: "round",
            }}
          >
            <Tooltip>{`${selectedHazard?.shortLabel} · ${route!.note}`}</Tooltip>
          </Polyline>
        )}

        {/* Destination marker for the selected hazard route */}
        {destination && route && (
          <CircleMarker
            center={destination}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: route.color,
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              📍 {route.destinationName}
            </Tooltip>
          </CircleMarker>
        )}

        {/* Home marker */}
        <CircleMarker
          center={[household.lat, household.lng]}
          radius={8}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#0F172A", fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            🏠 {markerLabel}
          </Tooltip>
        </CircleMarker>
      </MapContainer>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[260px] rounded-xl bg-background/95 p-3 text-xs text-foreground shadow-lg backdrop-blur">
        <p className="mb-1 font-semibold">
          {selectedHazard ? `${selectedHazard.shortLabel} rehearsal route` : "Risk map"}
        </p>
        {route && (
          <p className="mb-2 text-[11px] text-muted-foreground">
            Home → {route.destinationName}
            <br />
            <span className="italic">{route.note}</span>
          </p>
        )}
        <ul className="space-y-1.5">
          {route && (
            <li className="flex items-center gap-2">
              <span
                className="inline-block h-[3px] w-5 rounded"
                style={{ background: route.color }}
              />
              Pre-mapped route
            </li>
          )}
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
            Fault · WUI edge — low
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#0F172A" }} />
            Your home
          </li>
        </ul>
      </div>
    </div>
  );
}
