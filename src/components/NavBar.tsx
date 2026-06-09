import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Radar } from "lucide-react";
import { DemoScenarioDropdown, type DemoScenario } from "./DemoScenarioDropdown";
import { FlowNav } from "./FlowNav";
import { ReferenceNav } from "./ReferenceNav";

interface NavBarProps {
  activeScenario: string | null;
  onSelectScenario: (s: DemoScenario) => void;
}

export function NavBar({ activeScenario, onSelectScenario }: NavBarProps) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Radar className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="hidden text-lg tracking-tight sm:inline">Relief Radar</span>
        </Link>

        <div className="ml-4 hidden flex-1 items-center gap-4 xl:flex">
          <FlowNav currentPath={pathname} />
          <span className="h-6 w-px bg-border" aria-hidden="true" />
          <ReferenceNav />
        </div>

        <div className="ml-auto hidden items-center gap-3 xl:flex">
          {activeScenario && (
            <span className="rounded-full bg-surface px-3 py-1 text-xs text-foreground/90">
              Active scenario: <span className="font-medium text-primary">{activeScenario}</span>
            </span>
          )}
          <DemoScenarioDropdown onSelect={onSelectScenario} />
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground xl:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
            <div>
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
                Primary flow
              </p>
              <FlowNav
                currentPath={pathname}
                variant="vertical"
                onNavigate={() => setOpen(false)}
              />
            </div>
            <div className="border-t border-border pt-3">
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
                Reference
              </p>
              <ReferenceNav variant="vertical" onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-border pt-3">
              <DemoScenarioDropdown
                onSelect={(s) => {
                  onSelectScenario(s);
                  setOpen(false);
                }}
              />
              {activeScenario && (
                <p className="mt-2 text-xs text-foreground/80">
                  Active scenario:{" "}
                  <span className="font-medium text-primary">{activeScenario}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
