import { Link, useRouterState } from "@tanstack/react-router";
import { Radar, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { FLOW_STEPS } from "./FlowNav";
import { REFERENCE_LINKS } from "./ReferenceNav";
import { DemoScenarioDropdown, type DemoScenario } from "./DemoScenarioDropdown";

interface AppSidebarProps {
  activeScenario: string | null;
  onSelectScenario: (s: DemoScenario) => void;
}

export function AppSidebar({ activeScenario, onSelectScenario }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <Link to="/" className="flex items-center gap-2 px-1 py-2 text-foreground">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Radar className="h-5 w-5" aria-hidden="true" />
          </span>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight">Relief Radar</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-foreground/50">
              Primary flow
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {FLOW_STEPS.map((step, i) => {
                const active = pathname === step.to;
                const isLast = i === FLOW_STEPS.length - 1;
                return (
                  <SidebarMenuItem key={step.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={`${i + 1}. ${step.label}`}
                    >
                      <Link to={step.to} className="flex items-center gap-2">
                        <span
                          className={[
                            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                            active
                              ? "bg-primary text-primary-foreground"
                              : step.hub
                                ? "bg-primary/25 text-primary"
                                : "bg-surface text-foreground/70",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        {!collapsed && (
                          <>
                            <span className="truncate">{step.label}</span>
                            {step.hub && (
                              <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary">
                                Hub
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                    {!collapsed && !isLast && (
                      <div
                        className="ml-[18px] flex h-2 items-center"
                        aria-hidden="true"
                      >
                        <ChevronRight className="h-3 w-3 text-foreground/25" />
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-foreground/50">
              Reference
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {REFERENCE_LINKS.map((l) => {
                const active = pathname === l.to;
                return (
                  <SidebarMenuItem key={l.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={l.label}>
                      <Link to={l.to} className="flex items-center gap-2">
                        <span
                          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40"
                          aria-hidden="true"
                        />
                        {!collapsed && <span className="truncate">{l.label}</span>}
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
        <SidebarFooter className="border-t border-border">
          <div className="space-y-2 p-1">
            <DemoScenarioDropdown onSelect={onSelectScenario} />
            {activeScenario && (
              <p className="text-[11px] text-foreground/80">
                Active:{" "}
                <span className="font-medium text-primary">{activeScenario}</span>
              </p>
            )}
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
