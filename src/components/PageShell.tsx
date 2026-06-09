import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { StepIndicator } from "./StepIndicator";

interface PageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  showStepIndicator?: boolean;
}

export function PageShell({
  title,
  description,
  actions,
  children,
  showStepIndicator = true,
}: PageShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      {showStepIndicator && <StepIndicator currentPath={pathname} />}
      <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-base text-foreground/75">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </main>
  );
}
