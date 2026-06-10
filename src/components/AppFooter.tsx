export function AppFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-sm text-foreground/70 sm:flex-row sm:items-center sm:px-6">
        <p>
          Map data © <span className="underline-offset-2 hover:underline">OpenStreetMap</span>{" "}
          contributors
          <span className="ml-1 text-foreground/50">(attribution placeholder)</span>
        </p>
        <span className="text-foreground/50">Relief Radar</span>
      </div>
    </footer>
  );
}
