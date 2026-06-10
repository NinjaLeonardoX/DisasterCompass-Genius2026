import { Cloud, Droplets, Thermometer, Wind } from "lucide-react";
import { flags } from "@/lib/flags";
import { useCurrentWeather } from "@/lib/queries/weather";
import { LiveDataBadge } from "./LiveDataBadge";

// Compact "current conditions" card for the Respond flow. Renders nothing when
// the weather flag is off (so the offline demo is unchanged); when on it shows
// live conditions with a "Live" badge, or the demo fallback with a "Demo data"
// badge if the source is unreachable. Styled to match the civic-tech theme.

export function WeatherCard({ lat, lng }: { lat: number; lng: number }) {
  const { data, source } = useCurrentWeather(lat, lng);

  // Flag off ⇒ identical to the offline demo (card absent entirely).
  if (!flags.weather) return null;

  return (
    <section className="dc-card p-5 text-card-foreground">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-[color:var(--severity-low)]" aria-hidden="true" />
          <h3 className="text-sm font-bold tracking-tight">Current conditions</h3>
        </div>
        <LiveDataBadge source={source} />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{data.tempF}°F</p>
          <p className="text-sm text-card-foreground/70">{data.conditions}</p>
        </div>
        <dl className="space-y-1 text-right text-xs text-card-foreground/70">
          <div className="flex items-center justify-end gap-1.5">
            <Wind className="h-3.5 w-3.5" aria-hidden="true" />
            <dd className="tabular-nums">{data.windMph} mph wind</dd>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
            <dd className="tabular-nums">{data.precipitation.toFixed(2)} in precip</dd>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
            <dd className="tabular-nums">Feels-relevant for evac timing</dd>
          </div>
        </dl>
      </div>

      <p className="mt-3 text-[11px] italic text-card-foreground/55">
        {source === "live"
          ? "Live weather informs timing only — shelters, routes, and the decision stay rules-based."
          : "Demo weather shown — live feed unavailable. Not a replacement for emergency services; call 911."}
      </p>
    </section>
  );
}
