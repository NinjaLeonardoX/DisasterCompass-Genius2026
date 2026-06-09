import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppFooter } from "../components/AppFooter";
import { AppSidebar } from "../components/AppSidebar";
import { ScenarioProvider, useScenario } from "../components/ScenarioContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useRouterState } from "@tanstack/react-router";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-foreground/70">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-110"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-110"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DisasterCompass — Community disaster signal map" },
      {
        name: "description",
        content: "Turn community signals into prioritized disaster action.",
      },
      { property: "og:title", content: "DisasterCompass" },
      {
        property: "og:description",
        content: "Turn community signals into prioritized disaster action.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppChrome() {
  const { activeScenario, setActiveScenario } = useScenario();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = pathname === "/";

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activeScenario={activeScenario} onSelectScenario={setActiveScenario} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[color:var(--surface)] px-4 text-surface-foreground shadow-[0_8px_30px_-12px_rgba(42,59,85,0.45)] sm:px-6">
            <SidebarTrigger className="text-white hover:bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <span className="h-2 w-2 rounded-full bg-[color:var(--severity-low)] shadow-[0_0_0_3px_rgba(22,163,74,0.25)]" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold tracking-tight">
                <span className="text-white">Disaster</span>
                <span className="text-[color:var(--severity-low)]">Compass</span>
              </span>
              <span className="ml-2 hidden rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200 ring-1 ring-white/10 sm:inline-flex">
                North Creek Demo
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {activeScenario && (
                <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100 ring-1 ring-white/10 sm:inline-flex">
                  Active scenario:{" "}
                  <span className="ml-1 font-semibold text-[color:var(--severity-low)]">{activeScenario}</span>
                </span>
              )}
            </div>
          </header>
          <Outlet />
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ScenarioProvider>
        <AppChrome />
      </ScenarioProvider>
    </QueryClientProvider>
  );
}
