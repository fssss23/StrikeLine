import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Bookmark, Clock, Home, LogOut, Settings as Cog } from "lucide-react";
import { type ReactNode } from "react";
import { kse100 } from "@/lib/mock-data";
import { StrikeLine } from "@/components/StrikeLine";

type NavItem = { to: string; label: string; icon: typeof Home; badge?: boolean };
const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/alerts", label: "Alerts", icon: Bell, badge: true },
  { to: "/history", label: "History", icon: Clock },
  { to: "/settings", label: "Settings", icon: Cog },
];

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-[240px] bg-[#0D2F55] flex-col z-30">
      {/* Sidebar top: LogoInverse, full width, 64px tall, 24px left padding, vertically centered */}
      <div className="px-6 h-16 flex items-center">
        <Link to="/dashboard" className="inline-flex">
          <StrikeLine variant="inverse" />
        </Link>
      </div>
      <div className="h-px bg-white/10 mx-4" />
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-150 ${
                active
                  ? "text-white bg-white/[0.08]"
                  : "text-[#94A3B8] hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#2563EB] rounded-r-full" />
              )}
              <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto w-2 h-2 rounded-full bg-[#DC2626]" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1A4A7A] flex items-center justify-center text-white text-[13px] font-semibold">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[13px] font-semibold truncate">Ahmed Khan</div>
            <div className="text-[#94A3B8] text-[11px] truncate">ahmed@psxalerts.pk</div>
          </div>
          <Link to="/" className="text-[#94A3B8] hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ title }: { title: string }) {
  const isPositive = kse100.changePct >= 0;
  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-border flex items-center px-6 gap-4">
      <h1 className="text-[18px] font-bold text-foreground tracking-tight">{title}</h1>
      <div className="hidden lg:flex items-center gap-3 ml-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0]">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#16A34A] animate-pulse-dot" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-[#16A34A]" />
          </span>
          <span className="text-[12px] font-semibold text-[#15803D]">PSX Open</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-muted-foreground">KSE-100</span>
          <span className="font-bold text-foreground tabular">{kse100.value.toLocaleString()}</span>
          <span className={`font-semibold tabular ${isPositive ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            {isPositive ? "▲" : "▼"} {Math.abs(kse100.changePct).toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <Bell className="w-[18px] h-[18px] text-foreground" strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#1A4A7A] flex items-center justify-center text-white text-[12px] font-semibold">
          AK
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0D2F55] border-t border-white/10 flex items-center justify-around z-30">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link key={item.to} to={item.to} className="flex flex-col items-center gap-0.5 px-3 py-1">
            <Icon className={`w-5 h-5 ${active ? "text-white" : "text-[#94A3B8]"}`} strokeWidth={2} />
            <span className={`text-[10px] font-medium ${active ? "text-white" : "text-[#94A3B8]"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar />
      <div className="md:pl-[240px]">
        <TopBar title={title} />
        <main className="px-4 md:px-6 py-6 pb-24 md:pb-8 max-w-[1280px] mx-auto">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
