import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Cpu,
  ClipboardCheck,
  FileBarChart,
  Truck,
  MapPin,
  Bell,
  ScrollText,
  Settings,
  Users,
  Boxes,
  Upload,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useApp, useNotifications } from "@/lib/store";
import { useAuth, can } from "@/lib/auth";

const main = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Spare Inventory", url: "/inventory", icon: Package },
  { title: "Check In / Out", url: "/transactions", icon: ArrowLeftRight },
  { title: "Bulk Import", url: "/import", icon: Upload },
  { title: "Reorders", url: "/reorders", icon: ShoppingCart },
  { title: "Equipment", url: "/equipment", icon: Cpu },
  { title: "Inspections", url: "/inspections", icon: ClipboardCheck },
  { title: "Reports", url: "/reports", icon: FileBarChart },
];

const config = [
  { title: "Suppliers", url: "/suppliers", icon: Truck },
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Audit Logs", url: "/audit", icon: ScrollText },
  { title: "Users", url: "/users", icon: Users },
  { title: "Admin Settings", url: "/admin", icon: Settings },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const notifs = useNotifications();
  const { role } = useAuth();
  const visibleConfig = config.filter((i) => {
    if (i.url === "/users") return can(role, "users.manage");
    if (i.url === "/admin") return can(role, "users.manage");
    if (i.url === "/audit") return can(role, "audit.view");
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Critical Spares</span>
            <span className="text-xs text-muted-foreground">Manager</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleConfig.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.url === "/notifications" && notifs.length > 0 && (
                        <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                          {notifs.length}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          v1.0 · Demo data
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
