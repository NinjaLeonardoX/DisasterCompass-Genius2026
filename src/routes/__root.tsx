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
import { ScenarioProvider } from "../components/ScenarioContext";
import { PhaseProvider } from "../components/PhaseContext";
import { LocationProvider } from "../components/LocationContext";
import { MyAddressCard } from "../components/MyAddressCard";
import { Toaster } from "../components/ui/sonner";
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
      { title: "Disaster Compass — Community disaster signal map" },
      {
        name: "description",
        content: "Turn community signals into prioritized disaster action.",
      },
      { property: "og:title", content: "Disaster Compass — Community disaster signal map" },
      {
        property: "og:description",
        content: "Turn community signals into prioritized disaster action.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Disaster Compass — Community disaster signal map" },
      { name: "description", content: "DisasterCompass is a community disaster signal map and resilience dashboard." },
      { property: "og:description", content: "DisasterCompass is a community disaster signal map and resilience dashboard." },
      { name: "twitter:description", content: "DisasterCompass is a community disaster signal map and resilience dashboard." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3969376c-7c3e-47d0-9848-278202b959e8/id-preview-19d8ef5a--35dbcabd-3974-4554-9d8f-020b22eafb72.lovable.app-1781043932306.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3969376c-7c3e-47d0-9848-278202b959e8/id-preview-19d8ef5a--35dbcabd-3974-4554-9d8f-020b22eafb72.lovable.app-1781043932306.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/__l5e/assets-v1/60c3f676-91b0-4d0d-a6e8-5301953635a1/favicon.png" },
      { rel: "apple-touch-icon", href: "/__l5e/assets-v1/60c3f676-91b0-4d0d-a6e8-5301953635a1/favicon.png" },
    ],
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = pathname === "/";

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 text-slate-900 shadow-[0_8px_30px_-12px_rgba(42,59,85,0.25)] sm:px-6">
            <SidebarTrigger className="text-slate-700 hover:bg-slate-100" />
          </header>
          
          <Outlet />
          <AppFooter />
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ScenarioProvider>
        <PhaseProvider>
          <LocationProvider>
            <AppChrome />
          </LocationProvider>
        </PhaseProvider>
      </ScenarioProvider>
    </QueryClientProvider>
  );
}
