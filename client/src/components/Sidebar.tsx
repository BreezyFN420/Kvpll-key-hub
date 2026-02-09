import { Link, useLocation } from "wouter";
import { LayoutDashboard, Key, ShieldBan, Terminal, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/keys", icon: Key, label: "License Keys" },
  { href: "/blacklist", icon: ShieldBan, label: "Blacklist" },
  { href: "/script", icon: Terminal, label: "Lua Script" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="w-64 border-r border-border h-screen bg-card flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold font-mono tracking-tighter text-primary flex items-center gap-2">
          <Terminal className="h-6 w-6" />
          NEXUS_ADMIN
        </h1>
        <div className="mt-1 text-xs text-muted-foreground font-mono">
          v1.0.0-RELEASE
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary/10 text-primary shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <link.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </div>
  );
}
