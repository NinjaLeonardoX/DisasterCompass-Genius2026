import { ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="flex flex-col gap-4 rounded-2xl bg-white px-6 py-5 text-slate-900 shadow-md shadow-black/10 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Disaster Compass
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Rules-Based Guidance
        </span>
      </div>
    </header>
  );
}
