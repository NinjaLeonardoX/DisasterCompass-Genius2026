import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X, Presentation } from "lucide-react";
import dcLogo from "@/assets/disaster-compass-logo.png.asset.json";

// Shared marketing header for the static pages (landing, methodology,
// solution, presentation). Kept outside the app sidebar chrome.
export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = (
    <>
      <Link to="/methodology" className="hover:text-slate-900">
        Methodology
      </Link>
      <Link to="/solution" className="hover:text-slate-900">
        Our Solution
      </Link>
      <Link to="/presentation" className="inline-flex items-center gap-1.5 hover:text-slate-900">
        <Presentation className="h-4 w-4" />
        Presentation
      </Link>
    </>
  );

  return (
    <header className="relative z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center">
          <img
            src={dcLogo.url}
            alt="Disaster Compass — Community Disaster Action Planner"
            className="h-14 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {links}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/compass"
            className="group hidden items-center gap-2 rounded-full bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110 sm:inline-flex"
          >
            Go to App
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="flex flex-col gap-1 border-t border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-700 [&_a]:py-2 md:hidden">
          {links}
          <Link
            to="/compass"
            onClick={() => setMobileOpen(false)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#16A34A] px-4 py-2.5 font-semibold text-white"
          >
            Go to App
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </header>
  );
}
