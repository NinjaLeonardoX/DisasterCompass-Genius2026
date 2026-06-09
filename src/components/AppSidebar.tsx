import { Link, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  Map as MapIcon,
  Gauge,
  HandHeart,
  ShieldCheck,
  LifeBuoy,
  Info,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { DemoScenarioDropdown, type DemoScenario } from "./DemoScenarioDropdown";
import dcLogo from "@/assets/disaster-compass-logo.png.asset.json";



interface AppSidebarProps {
  activeScenario: string | null;
  onSelectScenario: (s: DemoScenario) => void;
}

const NAV = [
  { to: "/compass", label: "Compass Plan", Icon: Compass },
  { to: "/compass#map", label: "Safe Route Map", Icon: MapIcon },
  { to: "/compass#scores", label: "Route Scores", Icon: Gauge },
  { to: "/compass#volunteer", label: "Volunteer Match", Icon: HandHeart },
  { to: "/compass#coordinator", label: "Coordinator View", Icon: ShieldCheck },
  { to: "/compass#recovery", label: "Recovery Steps", Icon: LifeBuoy },
  { to: "/ai-disclosure", label: "AI Disclosure", Icon: Info },
] as const;

export function AppSidebar({ activeScenario, onSelectScenario }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/5 [&_[data-sidebar=sidebar]]:bg-[color:var(--surface)] [&_[data-sidebar=sidebar]]:text-surface-foreground"
    >
      <SidebarHeader className="border-b border-slate-200 bg-white">
        <Link to="/compass" className="flex items-center px-1 py-2">
          <img
            src={dcLogo.url}
            alt="DisasterCompass"
            className={`${collapsed ? "h-8 w-8 object-cover object-left" : "h-9 w-auto"}`}
          />
        </Link>
      </SidebarHeader>



      <SidebarContent className="bg-[color:var(--surface)]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ to, label, Icon }) => {
                const active = pathname + (typeof window !== "undefined" ? window.location.hash : "") === to
                  || (to === "/compass" && pathname === "/compass");
                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton
                      asChild
                      tooltip={label}
                      className={[
                        "group/nav my-0.5 rounded-lg text-slate-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white",
                        active ? "relative bg-white/10 text-white shadow-[inset_3px_0_0_0_var(--severity-low),0_0_24px_-12px_rgba(22,163,74,0.55)]" : "",
                      ].join(" ")}
                      data-active={active}
                    >
                      <Link to={to} className="flex items-center gap-2.5">
                        <Icon
                          className={[
                            "h-4 w-4 shrink-0",
                            active ? "text-[color:var(--severity-low)]" : "text-slate-400 group-hover/nav:text-white",
                          ].join(" ")}
                          aria-hidden="true"
                        />
                        {!collapsed && <span className="truncate text-sm font-medium">{label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="border-t border-white/10 bg-[color:var(--surface)]">
          <div className="space-y-2 p-1 text-slate-200">
            <DemoScenarioDropdown onSelect={onSelectScenario} />
            {activeScenario && (
              <p className="text-[11px] text-slate-300">
                Active: <span className="font-semibold text-[color:var(--severity-low)]">{activeScenario}</span>
              </p>
            )}
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
