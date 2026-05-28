import { useNavigate } from "@tanstack/react-router";
import { Search, Bell, LogOut, LogIn } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/StatusBadge";
import { SiteSelector } from "@/components/SiteSelector";
import { useNotifications } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";

export function TopBar() {
  const navigate = useNavigate();
  const { profile, user, role, session, signOut } = useAuth();
  const notifs = useNotifications();
  const [q, setQ] = useState("");

  const name = profile?.display_name || profile?.email || user?.email || "User";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <form
        className="relative flex-1 max-w-xl"
        onSubmit={(e) => { e.preventDefault(); navigate({ to: "/inventory", search: { q } as never }); }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search spare parts, equipment, suppliers…" className="pl-9" />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <SiteSelector />
        <Badge tone={role === "Admin" ? "primary" : role === "Manager" ? "info" : role === "Technician" ? "success" : "neutral"}>{role}</Badge>
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate({ to: "/notifications" })}>
          <Bell className="h-4 w-4" />
          {notifs.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {notifs.length}
            </span>
          )}
        </Button>
        {session ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => { await signOut(); toast.success("Signed out"); }}
          >
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </Button>
        ) : (
          <Button size="sm" onClick={() => navigate({ to: "/" })}>
            <LogIn className="mr-2 h-4 w-4" />Sign in
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8"><AvatarFallback>{initials}</AvatarFallback></Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>Settings</DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => { await signOut(); toast.success("Signed out"); }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
