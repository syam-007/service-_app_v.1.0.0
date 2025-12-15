// src/components/layout/AppLayout.tsx
import type { ReactNode } from "react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  FileCheck2,
  CalendarClock,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Theme = "light" | "dark";

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      document.documentElement.classList.toggle("dark", initial === "dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("theme", next);
      return next;
    });
  };

  return [theme, toggleTheme];
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false); // desktop only
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // mobile drawer
  const [theme, toggleTheme] = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const sidebarContent = (
    <>
      {/* Logo + collapse button (desktop only) */}
      <div className="h-14 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-3">
        <div className={`font-bold text-xs tracking-wide ${collapsed ? "hidden" : "block"} md:block`}>
          SMSvc
        </div>

        {/* Collapse button only on md+ */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="
            hidden md:flex h-9 w-9 items-center justify-center rounded-xl
            border border-slate-200 bg-white
            hover:bg-slate-50
            dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900
            text-black dark:text-white
            transition
          "
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-2 space-y-1 text-sm overflow-y-auto">
        <SidebarLink
          to="/"
          icon={LayoutDashboard}
          collapsed={collapsed}
          active={isActive("/")}
          label="Dashboard"
          onClick={closeMobileSidebar}
        />
        <SidebarLink
          to="/callouts"
          icon={ClipboardList}
          collapsed={collapsed}
          active={isActive("/callouts")}
          label="Callouts"
          onClick={closeMobileSidebar}
        />
        <SidebarLink
          to="/sros"
          icon={FileCheck2}
          collapsed={collapsed}
          active={isActive("/sros")}
          label="SRO"
          onClick={closeMobileSidebar}
        />
        <SidebarLink
          to="/schedules"
          icon={CalendarClock}
          collapsed={collapsed}
          active={isActive("/schedules")}
          label="Schedules"
          onClick={closeMobileSidebar}
        />
      </nav>

      {/* Bottom section: theme toggle */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-2">
        <button
          type="button"
          onClick={toggleTheme}
          title={collapsed ? (theme === "dark" ? "Dark mode" : "Light mode") : undefined}
          className="
            w-full flex items-center gap-3 rounded-xl px-2 py-2
            border border-transparent
            hover:bg-slate-100 dark:hover:bg-slate-800
            text-black dark:text-white
            transition
          "
        >
          <span
            className="
              inline-flex h-9 w-9 items-center justify-center rounded-xl
              border border-slate-200 bg-white
              dark:border-slate-800 dark:bg-slate-950
            "
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </span>

          {!collapsed && (
            <span className="flex-1 text-left text-xs font-medium">
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-black dark:bg-slate-900 dark:text-white">
      {/* Mobile sidebar (drawer) */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden transition-transform duration-200 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800">
          {sidebarContent}
        </aside>

        <div className="flex-1 bg-black/40" onClick={closeMobileSidebar}></div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex md:flex-col md:border-r md:border-slate-200 md:bg-white
          md:dark:bg-slate-950 md:dark:border-slate-800 md:transition-all md:duration-200
          ${collapsed ? "md:w-16" : "md:w-60"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Right side */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-14 flex-none border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              type="button"
              className="
                md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl
                border border-slate-200 bg-white
                text-black hover:bg-slate-50
                dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900
                transition
              "
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <span className="block h-[2px] w-4 bg-current mb-[3px]" />
              <span className="block h-[2px] w-4 bg-current mb-[3px]" />
              <span className="block h-[2px] w-4 bg-current" />
            </button>

            <div className="text-sm font-semibold">Service Management System</div>
          </div>

          <div className="text-[11px] text-slate-600 dark:text-slate-300 hidden xs:block">
            Logged in as <span className="font-medium">Demo User</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-slate-50 dark:bg-slate-900 p-3 sm:p-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

type SidebarLinkProps = {
  to: string;
  label: string;
  icon: React.ElementType;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
};

function SidebarLink({ to, label, icon: Icon, collapsed, active, onClick }: SidebarLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined} // tooltip when collapsed
      className={`
        group relative flex items-center gap-3 rounded-xl px-2 py-2
        transition-all duration-150
        ${
          active
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "text-black hover:bg-slate-100 dark:text-white dark:hover:bg-slate-900"
        }
      `}
    >
      {/* Icon container */}
      <span
        className={`
          inline-flex h-6 w-6 items-center justify-center rounded-xl
          border
          ${
            active
              ? "border-white/20 bg-white/10 dark:border-black/20 dark:bg-black/10"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900"
          }
        `}
      >
        {/* Icons inherit currentColor => black in light, white in dark */}
        <Icon className="h-4 w-4" />
      </span>

      {/* Label */}
      {!collapsed && <span className="text-xs font-medium truncate">{label}</span>}

      {/* Active indicator bar */}
      {active && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-emerald-400" />
      )}
    </Link>
  );
}
