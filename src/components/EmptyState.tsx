import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  heading: string;
  helper?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, heading, helper, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-primary">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      {helper && <p className="mt-2 max-w-md text-sm text-foreground/70">{helper}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
