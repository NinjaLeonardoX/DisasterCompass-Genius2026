import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteOption } from "@/types";
import {
  BLOCKED_ROADS,
  FLOOD_POLYGON,
  MAP_CENTER,
  MAP_ZOOM,
  SHELTERS,
  VOLUNTEERS,
} from "@/data/seed";
import { flags } from "@/lib/flags";
import { buildDriveModel, type DriveStatus } from "@/lib/driveSim";
import { useHousehold } from "./LocationContext";

// MapTiler key is server-only (process.env.MAPTILER_KEY). Tiles are proxied
// through /api/tiles/{z}/{x}/{y}.png so the key never reaches the browser.

// Client-only Leaflet map. This module is dynamically imported (see
// src/routes/map.tsx) so Leaflet's `window` access never runs during SSR.
// CircleMarkers are used instead of default pin icons to avoid the well-known
// Leaflet marker-icon bundler issue.

const ROUTE_COLORS: Record<RouteOption["colorType"], string> = {
  safe: "#16A34A",
  caution: "#D97706",
  rejected: "#9CA3AF",
};

// Banner colour per guidance status during the driving simulation.
const STATUS_STYLE: Record<DriveStatus, string> = {
  safe: "bg-emerald-600",
  caution: "bg-amber-500",
  blocked: "bg-red-600",
  arrived: "bg-emerald-600",
};

/** Tick interval (ms) between animation points while "driving". */
const DRIVE_TICK_MS = 230;

/** Stable empty list so the drive model isn't recomputed every render. */
const NO_BLOCKED_ROADS: typeof BLOCKED_ROADS = [];

/** A computed safe destination to plot (location-aware evacuation mode). */
export interface MapDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface MapPanelProps {
  /** Routes to draw — seed ROUTES when offline, live geometry when routing is on. */
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  /** CSS height of the map (default 520px). */
  height?: string;
  /** Map zoom (default MAP_ZOOM). Lower it for spread-out evacuation targets. */
  zoom?: number;
  /**
   * Seed-specific overlays (North Creek flood polygon, blocked roads, demo
   * shelter + volunteer markers + legend). Default true. Set false for the
   * location-aware mode, where these Boulder-anchored layers don't apply.
   */
  showDemoLayers?: boolean;
  /** Computed safe destinations to plot (location-aware mode). */
  destinations?: MapDestination[];
  /** Show the "Simulate driving" turn-by-turn overlay (Respond map). */
  enableDriveSim?: boolean;
}

export default function MapPanel({
  routes,
  selectedRouteId,
  onSelectRoute,
  height = "520px",
  zoom = MAP_ZOOM,
  showDemoLayers = true,
  destinations,
  enableDriveSim = false,
}: MapPanelProps) {
  const household = useHousehold();

  // Drive simulation follows the selected route, falling back to the safe one.
  const simRoute =
    routes.find((r) => r.id === selectedRouteId && r.colorType !== "rejected") ??
    routes.find((r) => r.colorType === "safe") ??
    routes.find((r) => r.colorType === "caution") ??
    null;
  const driveBlocked = showDemoLayers ? BLOCKED_ROADS : NO_BLOCKED_ROADS;
  const model = useMemo(
    () => (simRoute ? buildDriveModel(simRoute, driveBlocked) : null),
    [simRoute, driveBlocked],
  );

  const [frame, setFrame] = useState(0);
  const [driving, setDriving] = useState(false);

  // Reset the playhead whenever the simulated route changes.
  useEffect(() => {
    setDriving(false);
    setFrame(0);
  }, [simRoute?.id]);

  useEffect(() => {
    if (!driving || !model) return;
    if (frame >= model.points.length - 1) {
      setDriving(false);
      return;
    }
    const id = setTimeout(() => setFrame((f) => f + 1), DRIVE_TICK_MS);
    return () => clearTimeout(id);
  }, [driving, frame, model]);

  const drivePos = model?.points[frame] ?? null;
  const driveCue = model?.cues[frame] ?? null;
  const driveActive = frame > 0 || driving;
  const startDrive = () => {
    if (!model) return;
    setFrame(0);
    setDriving(true);
  };
  const hilltop = SHELTERS.find((s) => s.id === "shelter-hilltop")!;
  const ana = VOLUNTEERS.find((v) => v.id === "vol-ana")!;
  const center: [number, number] =
    household.lat && household.lng ? [household.lat, household.lng] : MAP_CENTER;

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height, width: "100%", borderRadius: "1rem" }}
      >
        {flags.tiles ? (
          <TileLayer
            attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="/api/tiles/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* Seed-only hazard overlays (North Creek demo). */}
        {showDemoLayers && (
          <>
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
          </>
        )}

        {/* Routes — rejected first so safe/caution draw on top */}
        {[...routes]
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
          center={[household.lat, household.lng]}
          radius={9}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#0EA5A4", fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            🏠 {household.name}
          </Tooltip>
        </CircleMarker>

        {/* Seed demo markers (Hilltop shelter + volunteer). */}
        {showDemoLayers && (
          <>
            <CircleMarker
              center={[hilltop.lat, hilltop.lng]}
              radius={10}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#16A34A", fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                ⛺ {hilltop.name}
              </Tooltip>
            </CircleMarker>

            <CircleMarker
              center={[ana.lat, ana.lng]}
              radius={8}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#7C3AED", fillOpacity: 1 }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                🚚 Volunteer {ana.name}
              </Tooltip>
            </CircleMarker>
          </>
        )}

        {/* Computed safe destinations (location-aware mode). */}
        {destinations?.map((d) => (
          <CircleMarker
            key={d.id}
            center={[d.lat, d.lng]}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#16A34A", fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              🛟 {d.name}
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Moving vehicle during the driving simulation. */}
        {enableDriveSim && drivePos && driveActive && (
          <CircleMarker
            center={drivePos}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#1D4ED8", fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              🚗 You
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>

      {/* Driving simulation — control button + turn-by-turn banner */}
      {enableDriveSim && simRoute && (
        <>
          <button
            type="button"
            onClick={driving ? () => setDriving(false) : startDrive}
            className="absolute right-4 top-4 z-[1000] inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg transition hover:opacity-90"
          >
            {driving
              ? "■ Stop"
              : frame > 0
                ? "▶ Drive again"
                : "▶ Simulate driving"}
          </button>

          {driveCue && driveActive && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-[1000] w-[min(20rem,calc(100%-9rem))] -translate-x-1/2">
              <div
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${STATUS_STYLE[driveCue.status]}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-white/90" />
                <span className="leading-tight">{driveCue.text}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/15">
                <div
                  className="h-full rounded-full bg-foreground/70 transition-all"
                  style={{
                    width: `${model ? Math.round((frame / (model.points.length - 1)) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Legend (seed demo only) */}
      {showDemoLayers && (
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
      )}
    </div>
  );
}
