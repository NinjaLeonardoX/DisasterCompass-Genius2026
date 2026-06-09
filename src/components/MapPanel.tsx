import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteOption } from "@/types";
import {
  BLOCKED_ROADS,
  FLOOD_POLYGON,
  MAP_CENTER,
  MAP_ZOOM,
  RIVERA_HOUSEHOLD,
  ROUTES,
  SHELTERS,
  VOLUNTEERS,
} from "@/data/seed";

// Client-only Leaflet map. This module is dynamically imported (see
// src/routes/map.tsx) so Leaflet's `window` access never runs during SSR.
// CircleMarkers are used instead of default pin icons to avoid the well-known
// Leaflet marker-icon bundler issue.

const ROUTE_COLORS: Record<RouteOption["colorType"], string> = {
  safe: "#16A34A",
  caution: "#D97706",
  rejected: "#9CA3AF",
};

interface MapPanelProps {
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
}

export default function MapPanel({ selectedRouteId, onSelectRoute }: MapPanelProps) {
  const hilltop = SHELTERS.find((s) => s.id === "shelter-hilltop")!;
  const ana = VOLUNTEERS.find((v) => v.id === "vol-ana")!;

  return (
    <div className="relative">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        scrollWheelZoom={false}
        style={{ height: "520px", width: "100%", borderRadius: "1rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Flood area */}
        <Polygon
          positions={FLOOD_POLYGON}
          pathOptions={{ color: "#2563EB", fillColor: "#3B82F6", fillOpacity: 0.25, weight: 1 }}
        >
          <Tooltip>Flood-risk area</Tooltip>
        </Polygon>

        {/* Blocked roads — red dashed */}
        {BLOCKED_ROADS.map((road) => (
          <Polyline
            key={road.id}
            positions={road.coordinates}
            pathOptions={{ color: "#DC2626", weight: 4, dashArray: "8 8" }}
          >
            <Tooltip>{`${road.name} — ${road.reason}`}</Tooltip>
          </Polyline>
        ))}

        {/* Routes — rejected first so safe/caution draw on top */}
        {[...ROUTES]
          .sort((a) => (a.colorType === "rejected" ? -1 : 1))
          .map((route) => {
            const selected = route.id === selectedRouteId;
            return (
              <Polyline
                key={route.id}
                positions={route.coordinates}
                pathOptions={{
                  color: ROUTE_COLORS[route.colorType],
                  weight: selected ? 7 : 4,
                  opacity: selected ? 1 : 0.7,
                  dashArray: route.colorType === "rejected" ? "2 10" : undefined,
                }}
                eventHandlers={{ click: () => onSelectRoute(route.id) }}
              >
                <Tooltip>{`${route.name} (${route.colorType})`}</Tooltip>
              </Polyline>
            );
          })}

        {/* Home marker */}
        <CircleMarker
          center={[RIVERA_HOUSEHOLD.lat, RIVERA_HOUSEHOLD.lng]}
          radius={9}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#0EA5A4", fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            🏠 {RIVERA_HOUSEHOLD.name}
          </Tooltip>
        </CircleMarker>

        {/* Hilltop shelter marker */}
        <CircleMarker
          center={[hilltop.lat, hilltop.lng]}
          radius={10}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#16A34A", fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            ⛺ {hilltop.name}
          </Tooltip>
        </CircleMarker>

        {/* Ana volunteer marker */}
        <CircleMarker
          center={[ana.lat, ana.lng]}
          radius={8}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#7C3AED", fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            🚚 Volunteer {ana.name}
          </Tooltip>
        </CircleMarker>
      </MapContainer>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-xl bg-background/90 p-3 text-xs text-foreground shadow-lg backdrop-blur">
        <p className="mb-2 font-semibold">Legend</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-1 w-5 rounded"
              style={{ background: ROUTE_COLORS.safe }}
            />
            Route B — safe (selected)
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-1 w-5 rounded"
              style={{ background: ROUTE_COLORS.caution }}
            />
            Route C — caution
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-1 w-5 rounded"
              style={{ background: ROUTE_COLORS.rejected }}
            />
            Route A — rejected
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-1 w-5 rounded border border-dashed"
              style={{ borderColor: "#DC2626" }}
            />
            Blocked road
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: "#3B82F6", opacity: 0.4 }}
            />
            Flood area
          </li>
        </ul>
      </div>
    </div>
  );
}
