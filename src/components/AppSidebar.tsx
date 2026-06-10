import { Link, useRouterState } from "@tanstack/react-router";
import { Radar, Compass as CompassIcon, LifeBuoy, BookOpen, Info, Brain } from "lucide-react";
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
import dcLogo from "@/assets/disaster-compass-logo.png.asset.json";
import { usePhase, type Phase } from "./PhaseContext";

const PHASES: { id: Phase; label: string; sub: string; Icon: typeof Radar }[] = [
  { id: "prepare", label: "Prepare", sub: "Readiness Radar", Icon: Radar },
  { id: "respond", label: "Respond", sub: "Compass Action Plan", Icon: CompassIcon },
  { id: "recover", label: "Recover", sub: "Recovery Launchpad", Icon: LifeBuoy },
];

const REFS = [
  { to: "/iq", label: "IQ Engine", Icon: Brain },
  { to: "/methodology", label: "Methodology", Icon: BookOpen },
  { to: "/ai-disclosure", label: "AI Disclosure", Icon: Info },
] as const;


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setActivePhase } = usePhase();
  const phaseRoutes: Record<Phase, "/compass/prepare" | "/compass/respond" | "/compass/recover"> = {
    prepare: "/compass/prepare",
    respond: "/compass/respond",
    recover: "/compass/recover",
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/5 [&_[data-sidebar=sidebar]]:bg-[color:var(--surface)] [&_[data-sidebar=sidebar]]:text-surface-foreground"
    >
      <SidebarHeader className="h-14 flex-row items-center border-b border-slate-200 bg-white p-0 px-2">
        <Link to="/" className="flex h-full items-center">
          <img
            src={dcLogo.url}
            alt="Disaster Compass"
            className={`${collapsed ? "h-7 w-7 object-cover object-left" : "h-8 w-auto"}`}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-[color:var(--surface)]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {PHASES.map(({ id, label, sub, Icon }) => {
                const to = phaseRoutes[id];
                const active = pathname === to || (id === "prepare" && pathname === "/compass");
                return (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={`${label} — ${sub}`}
                      className={[
                        "group/nav my-1 h-auto rounded-lg py-2.5 text-slate-300 hover:bg-white/8 hover:text-white",
                        active
                          ? "relative bg-white/10 text-white shadow-[inset_3px_0_0_0_var(--severity-low),0_0_24px_-12px_rgba(22,163,74,0.55)]"
                          : "",
                      ].join(" ")}
                      data-active={active}
                    >
                      <Link
                        to={to}
                        onClick={() => setActivePhase(id)}
                        className="flex items-start gap-2.5"
                      >
                        <Icon
                          className={[
                            "mt-0.5 h-4 w-4 shrink-0",
                            active
                              ? "text-[color:var(--severity-low)]"
                              : "text-slate-400 group-hover/nav:text-white",
                          ].join(" ")}
                          aria-hidden="true"
                        />
                        {!collapsed && (
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight">{label}</p>
                            <p className="truncate text-[11px] text-slate-400 group-hover/nav:text-slate-200">
                              {sub}
                            </p>
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 bg-[color:var(--surface)]">
        {!collapsed && (
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Reference
          </p>
        )}
        <SidebarMenu>
          {REFS.map(({ to, label, Icon }) => (
            <SidebarMenuItem key={to}>
              <SidebarMenuButton
                asChild
                tooltip={label}
                className="my-0.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <Link to={to} className="flex items-center gap-2.5">
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate text-xs">{label}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
