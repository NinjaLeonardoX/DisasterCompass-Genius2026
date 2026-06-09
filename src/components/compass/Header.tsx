import { ShieldCheck } from "lucide-react";
import dcLogo from "@/assets/disaster-compass-logo.png.asset.json";

export function Header() {
  return (
    <header className="flex flex-col gap-4 rounded-2xl bg-white px-6 py-5 text-slate-900 shadow-md shadow-black/10 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center">
        <img
          src={dcLogo.url}
          alt="DisasterCompass — Community Disaster Action Planner"
          className="h-14 w-auto"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          North Creek Demo
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Rules-Based Guidance
        </span>
      </div>
    </header>
  );
}
