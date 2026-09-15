import { useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard, Store, Workflow, Bot, CheckSquare, MapPin,
  ListTodo, BarChart3, Settings,
  Search, Bell, ChevronsLeftRight, ShieldCheck, LogOut, ClipboardCheck,
} from "lucide-react";
import CommandBar from "./CommandBar";
import NotificationPanel from "./NotificationPanel";
import { auth } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import { useRestaurants } from "../lib/useRestaurants";
import { buildRecommendations } from "../lib/agents";

const NAV = [
  { to: "/", label: "Command Centre", icon: LayoutDashboard, end: true },
  { to: "/restaurants", label: "Restaurants", icon: Store },
  { to: "/pipeline", label: "Onboarding Pipeline", icon: Workflow },
  { to: "/agents", label: "AI Agents", icon: Bot },
  { to: "/locator", label: "Restaurant Locator", icon: MapPin },
  { to: "/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/tasks", label: "Tasks & SLA", icon: ListTodo },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Shell({ children }: { children: ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mode, setMode] = useState<"Operations" | "Executive">("Operations");
  const { user, isAdmin } = useAuth();
  const { restaurants } = useRestaurants();
  const alertCount = buildRecommendations(restaurants).filter((r) => r.riskLevel !== "Green").length;
  const nav = isAdmin ? [...NAV, { to: "/admin/access", label: "Access Control", icon: ShieldCheck }] : NAV;
  const initials = (user.displayName ?? user.email ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-shell flex h-screen w-full overflow-hidden bg-paper text-ink">
      <aside className="app-sidebar flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-500 text-white"><ClipboardCheck size={17} /></div>
          <div>
            <div className="text-sm font-semibold leading-tight">Restaurant On-Boarding System</div>
            <div className="text-[11px] leading-tight text-ink-faint">Operations Command Centre</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] font-medium transition-colors ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-paper hover:text-ink"
                }`
              }
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border px-3 py-3">
          <button
            onClick={() => setMode(mode === "Operations" ? "Executive" : "Operations")}
            className="flex w-full items-center justify-between rounded border border-border px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper"
          >
            <span className="flex items-center gap-1.5"><ChevronsLeftRight size={13} /> {mode} View</span>
            <span className="text-ink-faint">Switch</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-topbar flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex w-96 max-w-[40vw] items-center gap-2 rounded border border-border bg-paper px-3 py-1.5 text-xs text-ink-faint hover:border-border-strong"
          >
            <Search size={14} />
            Ask AI or search restaurants, vendors, tasks…
            <kbd className="ml-auto rounded border border-border-strong bg-surface px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
          <div className="flex items-center gap-4">
            <button className="relative text-ink-soft hover:text-ink" onClick={() => setNotifOpen(true)}>
              <Bell size={18} />
              {alertCount > 0 && <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-status-red text-[9px] text-white">{alertCount}</span>}
            </button>
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{initials}</div>
              )}
              <div className="text-xs">
                <div className="font-medium">{user.displayName ?? user.email}</div>
                <div className="text-ink-faint">{isAdmin ? "Admin" : "Signed in"}</div>
              </div>
              <button onClick={() => signOut(auth)} title="Sign out" className="ml-1 text-ink-faint hover:text-status-red">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>
        <main className="app-main flex-1 overflow-y-auto px-6 py-5">
          <ExecutiveContext.Provider value={mode}>{children}</ExecutiveContext.Provider>
        </main>
      </div>

      {cmdOpen && <CommandBar onClose={() => setCmdOpen(false)} />}
      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
    </div>
  );
}

import { createContext, useContext } from "react";
export const ExecutiveContext = createContext<"Operations" | "Executive">("Operations");
export const useMode = () => useContext(ExecutiveContext);
