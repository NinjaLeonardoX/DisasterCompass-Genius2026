import { WifiOff } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-sm text-foreground/70 sm:flex-row sm:items-center sm:px-6">
        <p>
          Map data © <span className="underline-offset-2 hover:underline">OpenStreetMap</span>{" "}
          contributors
          <span className="ml-1 text-foreground/50">(attribution placeholder)</span>
        </p>
        <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-foreground/90">
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          Works offline — demo data
        </span>
      </div>
    </footer>
  );
}
